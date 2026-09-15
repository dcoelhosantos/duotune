import {useState, useRef} from "react";
import {Link, useNavigate} from "react-router-dom";

export default function GenerateInvite() {
    const [targetEmail, setTargetEmail] = useState("");
    const [generatedCode, setGeneratedCode] = useState("");
    const [viewState, setViewState] = useState("form");
    const [isLoading, setIsLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const copyTimeoutRef = useRef(null);
    const navigate = useNavigate();

    // TODO: Substituir o mock do currentUser pelos dados do usuário logado.
    const currentUser = {
        name: "Paulo",
        avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    };

    // TODO: Os dados do partnerUser devem iniciar vazios e ser preenchidos dinamicamente quando a API confirmar que o destinatário aceitou o convite.
    const partnerUser = {
        name: "Maria",
        avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // TODO: Substituir o setTimeout por uma chamada POST para /api/v1/duos/invitations passando o 'targetEmail'.
        // TODO: Tratar erros como 404 (Usuário não encontrado) ou 409 (Já pareado) e exibir na tela.
        // TODO: Atualizar o state 'generatedCode' com o código retornado pelo backend.
        // TODO: Após o sucesso, iniciar escuta via WebSocket (ou Long Polling) para saber o momento exato em que o parceiro aceitar.
        setTimeout(() => {
            setGeneratedCode("DUO-A1B2C");
            setViewState("waiting");
            setIsLoading(false);
        }, 1000);
    };

    const copyCode = () => {
        navigator.clipboard.writeText(generatedCode);
        setIsCopied(true);

        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
        }

        copyTimeoutRef.current = setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    const confirmCancel = () => {
        // TODO: Fazer uma requisição à API para invalidar ou deletar o convite gerado no banco de dados.
        setShowCancelModal(false);
        setViewState("form");
        setTargetEmail("");
    };

    // TODO: Remover esta função e o botão de dev em produção. A mudança para 'paired' deve ocorrer automaticamente através do WebSocket/Polling citado acima.
    const simulateAcceptance = () => {
        setViewState("paired");
        localStorage.setItem('accessToken', 'mock-token-dev');
        setTimeout(() => {
            navigate("/");
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-[#070118] text-white relative overflow-hidden font-sans">
            <div
                className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-purple-900/30 to-transparent blur-3xl pointer-events-none"></div>

            <header className="p-8 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-4 mb-1">
                        <Link to="/" className="text-fuchsia-500 hover:text-fuchsia-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                        </Link>
                        <h1 className="text-2xl font-bold text-white tracking-wide">Pareamento</h1>
                    </div>
                    <p className="text-gray-300 text-base ml-10">
                        Encontre alguém especial para compartilhar sua trilha sonora.
                    </p>
                </div>
            </header>

            <main className="flex flex-col items-center justify-center mt-6 relative z-10">
                {viewState === "form" && (
                    <div className="w-full max-w-md text-center animate-fade-in">
                        <h3 className="text-2xl font-semibold mb-6">Enviar convite</h3>
                        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                            <input
                                type="email"
                                placeholder="E-mail do seu parceiro(a)"
                                value={targetEmail}
                                onChange={(e) => setTargetEmail(e.target.value)}
                                required
                                className="w-full p-4 bg-[#11072b] rounded-xl border border-purple-900/50 focus:border-fuchsia-500 outline-none transition-colors text-base"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-medium transition-colors disabled:opacity-50 text-base"
                            >
                                {isLoading ? "Gerando..." : "Gerar Link de Convite"}
                            </button>
                        </form>
                    </div>
                )}

                {(viewState === "waiting" || viewState === "paired") && (
                    <div className="w-full max-w-2xl text-center animate-fade-in flex flex-col items-center">

                        <div className="flex items-center justify-center gap-8 mb-8">
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-36 h-36 rounded-full border-4 border-fuchsia-500 overflow-hidden bg-gray-800 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                                    <img src={currentUser.avatar} alt={currentUser.name}
                                         className="w-full h-full object-cover"/>
                                </div>
                                <span
                                    className="mt-4 text-base md:text-lg font-medium text-gray-200">{currentUser.name}</span>
                            </div>

                            <div
                                className={`text-7xl -mt-10 ${viewState === "waiting" ? "text-fuchsia-500 animate-pulse" : "text-fuchsia-500"}`}>
                                ♥
                            </div>

                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-36 h-36 rounded-full border-4 overflow-hidden bg-gray-800 flex items-center justify-center transition-colors duration-500 ${viewState === "waiting" ? "border-purple-700" : "border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)]"}`}>
                                    {viewState === "waiting" ? (
                                        <span className="text-4xl text-gray-500">?</span>
                                    ) : (
                                        <img src={partnerUser.avatar} alt={partnerUser.name}
                                             className="w-full h-full object-cover animate-fade-in"/>
                                    )}
                                </div>
                                <span className="mt-4 text-base md:text-lg font-medium text-gray-200">
                                    {viewState === "waiting" ? "Aguardando..." : partnerUser.name}
                                </span>
                            </div>
                        </div>

                        {viewState === "waiting" ? (
                            <>
                                <h3 className="text-3xl font-semibold mb-2">Convite enviado!</h3>
                                <p className="text-gray-300 text-base mb-6">
                                    Aguardando a outra pessoa aceitar o convite<br/>para formarmos a dupla.
                                </p>

                                <div
                                    className="bg-[#11072b] border border-purple-800/60 rounded-xl px-6 py-4 mb-8 max-w-md w-full flex items-center gap-5 text-left">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                         className="w-8 h-8 text-purple-500 shrink-0">
                                        <path
                                            d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/>
                                        <path
                                            d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/>
                                    </svg>
                                    <p className="text-gray-300 text-sm md:text-base">
                                        Um convite também foi enviado automaticamente para o e-mail <strong
                                        className="text-white">{targetEmail}</strong>.
                                    </p>
                                </div>

                                <div className="w-full max-w-lg mb-8">
                                    <div
                                        className="bg-[#14082e] p-2 rounded-xl flex items-center justify-between border border-purple-900/50">
                                        <div className="pl-4 py-2 text-left">
                                            <span className="text-sm text-purple-400 block mb-1 font-semibold">Código do convite</span>
                                            <span className="text-lg text-white font-mono">{generatedCode}</span>
                                        </div>
                                        <button
                                            onClick={copyCode}
                                            className={`px-8 py-3 rounded-lg font-medium h-full transition-colors text-base ${isCopied ? 'bg-green-600 text-white' : 'bg-purple-700 hover:bg-purple-600 text-white'}`}
                                        >
                                            {isCopied ? "Copiado!" : "Copiar"}
                                        </button>
                                    </div>
                                    <div className="h-6 mt-3">
                                        {isCopied && (
                                            <p className="text-green-400 text-base font-medium animate-fade-in">
                                                ✓ Código copiado com sucesso!
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button onClick={() => setShowCancelModal(true)}
                                        className="text-base text-purple-400 hover:text-purple-300 transition-colors">
                                    Cancelar convite
                                </button>

                                <button onClick={simulateAcceptance}
                                        className="mt-16 text-xs text-gray-600 border border-gray-800 px-3 py-1 rounded hover:bg-gray-900">
                                    [Dev] Simular Aceite Completo
                                </button>
                            </>
                        ) : (
                            <div className="animate-fade-in">
                                <h3 className="text-3xl font-semibold mb-2 text-fuchsia-400">Dupla Formada!</h3>
                                <p className="text-gray-300 text-base mb-10">Você e {partnerUser.name} agora estão
                                    conectados no DuoTune.</p>
                                <div
                                    className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto opacity-50"></div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {showCancelModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in px-4">
                    <div
                        className="bg-[#170c30] p-8 rounded-2xl border border-purple-900/50 max-w-sm w-full text-center shadow-2xl">
                        <h4 className="text-xl font-bold text-white mb-3">Cancelar convite?</h4>
                        <p className="text-gray-400 text-base mb-8">
                            O código gerado será invalidado e você precisará criar um novo para formar um duo.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-3 rounded-xl font-medium bg-gray-800 hover:bg-gray-700 text-white transition-colors text-base"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="flex-1 py-3 rounded-xl font-medium bg-red-600/90 hover:bg-red-500 text-white transition-colors shadow-[0_0_15px_-3px_rgba(220,38,38,0.4)] text-base"
                            >
                                Sim, cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}