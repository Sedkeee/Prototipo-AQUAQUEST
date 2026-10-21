/* ============================================================
   MODELO · COMUNIDAD — publicaciones, likes y comentarios
   Los posts son COMPARTIDOS entre todas las cuentas del navegador.
   Cada like se registra con el id del usuario (likedBy).
   ============================================================ */
(function () {
  const S = AQ.models.Storage;
  const POSTS_KEY = "aquaquest_comunidad_posts";

  const CATEGORIAS = {
    accion:   { label: "Acción",   clase: "cat-accion" },
    idea:     { label: "Idea",     clase: "cat-idea" },
    pregunta: { label: "Pregunta", clase: "cat-pregunta" },
    logro:    { label: "Logro",    clase: "cat-logro" }
  };

  const POSTS_SEMILLA = [
    {
      id: "seed1", autor: "Camila R.", avatar: "CR", categoria: "accion", fecha: "10/09/2026",
      texto: "Hoy con mi curso recogimos 32 botellas y 12 bolsas de la orilla del río. La cantidad de plástico que llega al agua es impresionante. ¡Hagamos más jornadas así!",
      imagen: null, likes: 14,
      comentarios: [
        { autor: "Andrés", fecha: "10/09/2026", texto: "¡Uff, gran trabajo! ¿En qué río fue?" },
        { autor: "Camila R.", fecha: "10/09/2026", texto: "En la quebrada cerca al colegio. Estaba llena de basura." }
      ]
    },
    {
      id: "seed2", autor: "Profe Julián", avatar: "PJ", categoria: "idea", fecha: "09/09/2026",
      texto: "Idea para colegios: instalar un 'medidor de agua' visible en el patio. Que los estudiantes vean cuánta consume el colegio cada semana y propongan metas de reducción. Es una manera fácil de hacer visible lo invisible.",
      imagen: null, likes: 22,
      comentarios: [
        { autor: "Sofía", fecha: "09/09/2026", texto: "¡Me encanta! Lo propongo en mi institución." }
      ]
    },
    {
      id: "seed3", autor: "Nicolás M.", avatar: "NM", categoria: "pregunta", fecha: "08/09/2026",
      texto: "Alguien sabe por qué el hierro total en agua puede subir tanto en una muestra? Vi en los datos del Atrato que en 2018 salió 52 mg/L y en 2022 apenas 3.67 mg/L. ¿Es normal tanta variación?",
      imagen: null, likes: 8,
      comentarios: [
        { autor: "Profe Julián", fecha: "08/09/2026", texto: "Buena pregunta. Suele estar asociado a escorrentía por lluvias y a la geología de la cuenca. Los metales en agua varían mucho entre temporadas." }
      ]
    },
    {
      id: "seed4", autor: "Valentina", avatar: "VA", categoria: "logro", fecha: "07/09/2026",
      texto: "¡Llegué a 'Guardián de río' con 500 XP! Empecé hace una semana con retos pequeños: cerrar llaves, ducha corta, y contarle a mi familia lo que aprendí. Súper recomendado.",
      imagen: null, likes: 31, comentarios: []
    }
  ];

  const clonar = o => JSON.parse(JSON.stringify(o));
  const semilla = () => clonar(POSTS_SEMILLA).map(p => ({ ...p, likedBy: [] }));

  let posts = [];
  let usuarioId = null;
  const guardar = () => S.set(POSTS_KEY, posts);

  AQ.models.Comunidad = {
    CATEGORIAS,

    cargar(idUsuario) {
      usuarioId = idUsuario;
      const guardados = S.get(POSTS_KEY, null);
      posts = Array.isArray(guardados) && guardados.length ? guardados : semilla();
      posts.forEach(p => { if (!Array.isArray(p.likedBy)) p.likedBy = []; });
      guardar();
    },

    /** Posts listos para mostrar, ya filtrados y ordenados. */
    obtenerPosts(filtro = "todos") {
      let lista = posts.slice();
      if (filtro !== "todos") lista = lista.filter(p => p.categoria === filtro);
      lista.sort((a, b) => (b.orden || 0) - (a.orden || 0));
      return lista.map(p => ({
        ...p,
        reaccionado: p.likedBy.includes(usuarioId),
        totalLikes: (p.likes || 0) + p.likedBy.length,
        esMio: p.autorId === usuarioId
      }));
    },

    /** Devuelve el post creado o null si no se pudo guardar (espacio lleno). */
    publicar({ autor, avatar, categoria, texto, imagen }) {
      const post = {
        id: "p_" + Date.now(),
        autor, autorId: usuarioId, avatar,
        categoria: CATEGORIAS[categoria] ? categoria : "accion",
        fecha: AQ.utils.hoyDisplay(),
        texto, imagen: imagen || null,
        likes: 0, likedBy: [], comentarios: [],
        orden: Date.now()
      };
      posts.unshift(post);
      if (!guardar()) { posts.shift(); return null; }
      return post;
    },

    toggleLike(postId) {
      const p = posts.find(x => x.id === postId);
      if (!p) return;
      const i = p.likedBy.indexOf(usuarioId);
      if (i === -1) p.likedBy.push(usuarioId); else p.likedBy.splice(i, 1);
      guardar();
    },

    comentar(postId, autor, texto) {
      const p = posts.find(x => x.id === postId);
      if (!p) return false;
      p.comentarios.push({ autor, autorId: usuarioId, fecha: AQ.utils.hoyDisplay(), texto });
      return guardar();
    },

    /** Borra posts y likes del usuario actual (los de otros se conservan). */
    resetUsuario() {
      posts = posts.filter(p => p.autorId !== usuarioId);
      posts.forEach(p => { p.likedBy = p.likedBy.filter(id => id !== usuarioId); });
      if (posts.length === 0) posts = semilla();
      guardar();
    }
  };
})();
