import adapter from '@sveltejs/adapter-node';

const config = {
	kit: {
		adapter: adapter(),
		csp: {
			mode: 'auto',
			directives: {
				'script-src': ['self'], // ya sin 'unsafe-inline'
				'default-src': ['self'],
				'style-src': [
					'self',
					'unsafe-inline',               // sigue permitiendo estilos inline
					'https://cdn.jsdelivr.net',    // tu CDN habitual
					'https://sos2425-oct-amn.onrender.com' // tu dominio de Render
				],
				'img-src': ['self', 'data:', 'https:'],
				'connect-src': [
					'self',
					'http://localhost:16078',
					'https://sos2425-crr.onrender.com',         
                    'https://sos2425-15.onrender.com',
                    'https://sos2425-20.onrender.com', 
                    'https://sos2425-agb.onrender.com'
				]
			}
		}
	}
};

export default config;
