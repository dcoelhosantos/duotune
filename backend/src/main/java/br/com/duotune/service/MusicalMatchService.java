package br.com.duotune.service;

import br.com.duotune.model.MusicalMatch;
import br.com.duotune.model.MatchListeningEntry;
import br.com.duotune.repository.MusicalMatchRepository;
import br.com.duotune.dto.MatchResponse;
import br.com.duotune.dto.RecentPlay;

import br.com.duotune.model.Duo;
import br.com.duotune.model.User;
import br.com.duotune.repository.DuoRepository;
import br.com.duotune.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@Service
public class MusicalMatchService {
    private final UserRepository users;
    private final DuoRepository duos;
    private final MusicalMatchRepository matches;
    private final SpotifyHistoryService spotify;
    private final TransactionTemplate transactions;

    public MusicalMatchService(UserRepository users, DuoRepository duos, MusicalMatchRepository matches,
            SpotifyHistoryService spotify, PlatformTransactionManager manager) {
        this.users = users;
        this.duos = duos;
        this.matches = matches;
        this.spotify = spotify;
        transactions = new TransactionTemplate(manager);
    }

    // O cliente nunca escolhe o casal ou os usuários consultados.
    private Duo activeDuo(String email) {
        User user = users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Long id = duos.findActiveDuoId(user.getId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Forme seu Duo para descobrir o match musical."));
        return duos.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public MatchResponse.Overview overview(String email) {
        return transactions.execute(status -> overview(activeDuo(email)));
    }

    public MatchResponse.Overview calculate(String email) {
        // Resolve participantes antes da rede: a transação de gravação fica curta.
        Duo duo = transactions.execute(status -> {
            Duo current = activeDuo(email);
            current.getUser1().getEmail();
            current.getUser2().getEmail();
            return current;
        });
        List<RecentPlay> first = spotify.recent(duo.getUser1());
        List<RecentPlay> second = spotify.recent(duo.getUser2());
        if (first.isEmpty() || second.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
                    "Dados insuficientes: os dois precisam ter músicas no histórico recente do Spotify. Ouçam algumas faixas e tentem novamente.");
        }
        var score = MatchCalculator.calculate(first, second);
        return transactions.execute(status -> {
            Duo current = activeDuo(email);
            if (!current.getId().equals(duo.getId())) throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seu Duo mudou durante o cálculo. Atualize a página.");
            MusicalMatch match = new MusicalMatch(current, score);
            first.forEach(play -> match.getEntries().add(new MatchListeningEntry(match, current.getUser1(), play)));
            second.forEach(play -> match.getEntries().add(new MatchListeningEntry(match, current.getUser2(), play)));
            matches.save(match);
            return overview(current);
        });
    }

    private MatchResponse.Overview overview(Duo duo) {
        var history = matches.findTop10ByDuoIdOrderByCalculatedAtDescIdDesc(duo.getId());
        return new MatchResponse.Overview(history.isEmpty() ? null : response(history.get(0)),
                history.stream().map(match -> new MatchResponse.History(match.getId(), match.getCalculatedAt(), match.getPercentage())).toList());
    }

    private MatchResponse response(MusicalMatch match) {
        User firstUser = match.getDuo().getUser1();
        User secondUser = match.getDuo().getUser2();
        var first = plays(match, firstUser);
        var second = plays(match, secondUser);
        return new MatchResponse(match.getId(), match.getCalculatedAt(), match.getFormulaVersion(), match.getPercentage(),
                match.getArtistSimilarity(), match.getTrackSimilarity(), match.getArtistPoints(), match.getTrackBonus(),
                List.of(member(firstUser, first), member(secondUser, second)),
                shared(first, second, true), shared(first, second, false));
    }

    private List<RecentPlay> plays(MusicalMatch match, User user) {
        return match.getEntries().stream().filter(entry -> entry.getUser().getId().equals(user.getId()))
                .map(MatchListeningEntry::toPlay).toList();
    }

    private MatchResponse.Member member(User user, List<RecentPlay> plays) {
        return new MatchResponse.Member(user.getName(), plays.size(), MatchCalculator.trackIds(plays).size(),
                MatchCalculator.artistIds(plays).size(),
                plays.stream().map(RecentPlay::playedAt).min(Comparator.naturalOrder()).orElse(null),
                plays.stream().map(RecentPlay::playedAt).max(Comparator.naturalOrder()).orElse(null));
    }

    private List<MatchResponse.SharedItem> shared(List<RecentPlay> first, List<RecentPlay> second, boolean artists) {
        Set<String> otherIds = artists ? MatchCalculator.artistIds(second) : MatchCalculator.trackIds(second);
        Map<String, String> names = new HashMap<>();
        first.forEach(play -> {
            if (artists) names.putAll(play.artists());
            else names.put(play.trackId(), play.trackName());
        });
        return names.entrySet().stream().filter(entry -> otherIds.contains(entry.getKey()))
                .map(entry -> new MatchResponse.SharedItem(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(MatchResponse.SharedItem::name).thenComparing(MatchResponse.SharedItem::id)).toList();
    }
}
