import {useState, useEffect} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";

const validateFormat = (codeToTest) => {
    const regex = /^DUO-[A-Z0-9]{5}$/;
    return regex.test(codeToTest);
};

export default function AcceptInvite() {
    const {code} = useParams();
    const navigate = useNavigate();

    const [inviteCode, setInviteCode] = useState(() => {
        return code && validateFormat(code) ? code : "";
    });
    const [viewState, setViewState] = useState("form");

    const [error, setError] = useState(() => {
        if (code && !validateFormat(code)) {
            return "O link de convite acessado é inválido. Por favor, insira o código manualmente abaixo.";
        }
        return "";
    });

    const [isLoading, setIsLoading] = useState(() => {
        return !!(code && validateFormat(code));
    });

    // TODO: Substituir estes mocks pelos dados reais.
    // currentUser virá do provedor de autenticação.
    // partnerUser virá da resposta da chamada da API ao formar o Duo com sucesso.
    const currentUser = {
        name: "Maria",
        avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    };
    const partnerUser = {
        name: "Paulo",
        avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    };

    const performPairingApiCall = () => {
        // TODO: Substituir o setTimeout pela chamada HTTP real (POST /api/v1/duos/invitations/{code}/accept)
        // TODO: Adicionar bloco try/catch para capturar erros 400 (inválido/expirado), 404 e 409 vindos da API e exibi-los no setError.
        setTimeout(() => {
            setIsLoading(false);
            setViewState("paired");

            // TODO: Atualizar o Contexto global da aplicação para sinalizar que o usuário agora possui um Duo ativo.
            localStorage.setItem('accessToken', 'mock-token-dev');

            setTimeout(() => {
                navigate("/");
            }, 3500);
        }, 1500);
    };

    useEffect(() => {
        if (code && validateFormat(code)) {
            performPairingApiCall();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    const handleAccept = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateFormat(inviteCode)) {
            setError("Formato inválido. O código deve ter exatamente 5 caracteres após o prefixo (ex: DUO-A1B2C).");
            return;
        }

        setIsLoading(true);
        performPairingApiCall();
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
                        Pronto para se conectar e compartilhar sua trilha sonora?
                    </p>
                </div>
            </header>

            <main className="flex flex-col items-center justify-center mt-12 relative z-10">
                {viewState === "form" ? (
                    <div className="w-full max-w-md text-center animate-fade-in px-4">
                        <h3 className="text-3xl font-semibold mb-2">Aceitar Convite</h3>
                        <p className="text-gray-400 text-base mb-8">
                            Insira o código que você recebeu do seu parceiro.
                        </p>

                        {error && (
                            <div
                                className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm animate-fade-in">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAccept} className="flex flex-col gap-6">
                            <input
                                type="text"
                                placeholder="DUO-XXXXX"
                                value={inviteCode}
                                maxLength={9}
                                onChange={(e) => {
                                    setError("");
                                    setInviteCode(e.target.value.toUpperCase());
                                }}
                                required
                                className="w-full p-4 bg-[#11072b] rounded-xl border border-purple-900/50 focus:border-fuchsia-500 outline-none transition-colors tracking-widest text-center text-xl font-mono shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || inviteCode.length < 9}
                                className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-base shadow-[0_0_20px_-5px_rgba(217,70,239,0.4)]"
                            >
                                {isLoading ? "Validando conexão..." : "Entrar no Duo"}
                            </button>
                        </form>
                    </div>
                ) : (
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

                            <div className="text-7xl -mt-10 text-fuchsia-500 animate-pulse">♥</div>

                            <div className="flex flex-col items-center">
                                <div
                                    className="w-36 h-36 rounded-full border-4 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)] overflow-hidden bg-gray-800 flex items-center justify-center">
                                    <img src={partnerUser.avatar} alt={partnerUser.name}
                                         className="w-full h-full object-cover animate-fade-in"/>
                                </div>
                                <span className="mt-4 text-base md:text-lg font-medium text-gray-200">
                                    {partnerUser.name}
                                </span>
                            </div>
                        </div>

                        <div className="animate-fade-in mt-4">
                            <h3 className="text-3xl font-semibold mb-2 text-fuchsia-400">Conexão Estabelecida!</h3>
                            <p className="text-gray-300 text-base mb-10">Você e {partnerUser.name} agora formam um
                                Duo.</p>
                            <div
                                className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto opacity-75"></div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}