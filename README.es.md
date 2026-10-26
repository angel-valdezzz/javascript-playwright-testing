# javascript-playwright-testing

**Javascript + Playwright Test** - ParaBank (UI) and Demo Users API (API).

[English](README.md) � [Espa�ol](README.es.md)

Ejemplo independiente: este repositorio contiene sus propias pruebas, dependencias y CI.

## Instalaci�n

El lanzador y la API local usan Python 3.12. Los proyectos Node usan Node 22; los de Java, JDK 21 y Maven 3.9+.

```sh
npm install
python -m pip install -r requirements-service.txt
```

## Ejecuci�n

```sh
python scripts/run.py --local-api -- npm test
```

Para una API externa, define DEMO_BASE_URL y DEMO_API_KEY y omite --local-api. PARABANK_URL cambia la URL web. Define las variables en tu terminal: los archivos .env no se cargan autom�ticamente.

El CI web usa un contenedor aislado de ParaBank oficial con JDBC y registra el digest de su imagen. Nunca cambia la configuraci�n de la instancia p�blica. La ejecuci�n local usa la URL p�blica salvo que cambies PARABANK_URL.

## Estructura y reportes

Las pruebas describen escenarios; pages/helpers encapsulan las interacciones web y HTTP. scripts/run.py administra la API local real y oculta su credencial temporal en consola y reportes de texto. Actions conserva los reportes nativos incluso si fallan las pruebas.

Consulta [scenarios](docs/scenarios.md), [validation status](VALIDATION.md) and [CI](.github/workflows/ci.yml).

ParaBank p�blico puede fallar independientemente de las pruebas. Usa solamente datos ficticios. No subas credenciales ni actives trazas de API que guarden encabezados de autenticaci�n.
