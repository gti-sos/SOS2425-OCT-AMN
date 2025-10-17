/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const response = await resolve(event);

    // Lista de TODOS los dominios de Render de mis compañeros
    const allowedApiDomains = [
        'https://sos2425-crr.onrender.com/api/v1/annual-evolutions', 
        'https://sos2425-15.onrender.com/api/v1/temperature-stats',
        'https://sos2425-20.onrender.com/api/v1/fines',
        'https://sos2425-AGB.onrender.com/api/v1/public-transit-stats'
   
        
    ].join(' '); 

    //  Definición de la Content-Security-Policy
    // 'connect-src' es la directiva que te permite conectar a APIs externas.
    const csp = `
        default-src 'self';
        script-src 'self';
        style-src 'self' 'unsafe-inline';
        connect-src 'self' ${allowedApiDomains}; 
        
    `.replace(/\s+/g, ' ').trim(); 

    // Aplicar la cabecera a la respuesta HTTP
    response.headers.set('Content-Security-Policy', csp);

    return response;
}