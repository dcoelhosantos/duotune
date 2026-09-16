import { FiPlay, FiUserPlus } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function Home() {
  const hasDuo = false;

  const playlists = [
    {
      id: 1,
      name: "Nossa História",
      creator: "Você e Lucas",
      color: "bg-gradient-to-br from-fuchsia-600 to-purple-900",
    },
    {
      id: 2,
      name: "Indie Vibes",
      creator: "Você",
      color: "bg-gradient-to-br from-blue-600 to-indigo-900",
    },
    {
      id: 3,
      name: "Para Relaxar",
      creator: "Lucas",
      color: "bg-gradient-to-br from-emerald-600 to-teal-900",
    },
    {
      id: 4,
      name: "Rock Clássico",
      creator: "Você",
      color: "bg-gradient-to-br from-orange-600 to-red-900",
    },
  ];

  return (
    <div className="space-y-8">
      {!hasDuo && (
        <div className="bg-gradient-to-r from-fuchsia-700 to-purple-900 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-lg border border-fuchsia-500/30">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Encontre sua dupla! 🎵
            </h2>
            <p className="text-purple-200">
              Você ainda não formou o seu Duo. Convide alguém especial para
              compartilhar e mesclar sua trilha sonora.
            </p>
          </div>
          <Link
            to="/generate-invite"
            className="mt-6 md:mt-0 bg-white text-fuchsia-700 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-md hover:scale-105"
          >
            <FiUserPlus size={20} />
            Convidar agora
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold mb-6">Olá!</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="flex items-center gap-4 bg-gray-800/50 hover:bg-gray-800 transition-colors rounded-md overflow-hidden cursor-pointer group"
            >
              <div
                className={`w-20 h-20 ${playlist.color} flex-shrink-0 shadow-lg`}
              />
              <div className="font-semibold">{playlist.name}</div>
              <button className="ml-auto mr-4 w-12 h-12 bg-fuchsia-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl hover:scale-105">
                <FiPlay size={24} className="text-white fill-white ml-1" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8">
        <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">
          Sua Biblioteca Pessoal
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="bg-gray-950 p-4 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer group select-none"
            >
              <div className="w-full aspect-square bg-gray-800 rounded-md mb-4 shadow-lg overflow-hidden relative">
                <img
                  src={`https://picsum.photos/seed/${item}/200`}
                  alt="Capa"
                  className="w-full h-full object-cover"
                />
                <button className="absolute bottom-2 right-2 w-10 h-10 bg-fuchsia-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 shadow-md">
                  <FiPlay size={20} className="text-white fill-white ml-1" />
                </button>
              </div>
              <h3 className="font-semibold truncate">
                Cápsula do Tempo #{item}
              </h3>
              <p className="text-sm text-gray-400 truncate mt-1">
                Lembranças Musicais
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
