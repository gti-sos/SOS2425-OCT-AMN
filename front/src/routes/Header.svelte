<header>
    <div class="header-row">
        <div class="brand">
            <img src="/favicon.ico" alt="Logo" class="logo" />
            <span class="project-title">SOS2425-OCT-AMN</span>
        </div>
        <nav class="navbar">
            <ul>
                <li><a href="/" id="inicio">Inicio</a></li>
                <li><a href="/about" id="about">Acerca de</a></li>
                <li><a href="/forest-fires" id="forest-fires">Incendios forestales</a></li>  
            </ul>
        </nav>
    </div>
</header>

<style>
header {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(202, 196, 196, 0.95) 100%);
    color: #333;
    padding: 3px 3px;
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(5px);
}

.header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.brand {
    display: flex;
    align-items: center;
    gap: 8px;
}

.logo {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.project-title {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
}

.navbar ul {
    list-style: none;
    display: flex;
    gap: 16px;
    margin: 0;
    padding: 0;
}

.navbar li {
    font-size: 1.1rem;
    font-family: 'Segoe UI', sans-serif;
}
.navbar a {
    color: #333;
    text-decoration: none;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 18px;
    font-size: 0.95rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(224, 224, 224, 0.9) 100%);
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    border: 1px solid rgba(0, 0, 0, 0.1);
}

.navbar a:hover {
    color: white;
    transform: translateY(-3px);
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2);
}

.navbar a#inicio:hover {
    background: linear-gradient(135deg, #a79d18 0%, #a79d18 100%);
}
.navbar a#about:hover {
    background: linear-gradient(135deg, #754295 0%, #4A148C 100%);
}
.navbar a#forest-fires:hover {
    background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
}
</style>
