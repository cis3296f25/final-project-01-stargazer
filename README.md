Star Gazer
Star Gazer is an interactive web app that lets users explore the night sky from any point in time and space. Whether you’re curious about what the stars looked like on your birthday, during a historical event, or at a future date, Star Gazer brings the cosmos to your fingertips.
The app provides:
🌠 Real-time celestial visualization – view constellations, planets, and stars as they appeared at a chosen date and location.
♈ Astrological insights – discover zodiac constellations and horoscope alignments associated with specific times.
🗺️ Interactive map interface – easily select global locations and times using an intuitive, responsive design.
📱 Educational and personal use – perfect for astronomy enthusiasts, students, or anyone interested in the connection between the stars and human experience.
Built with modern web technologies for performance and clarity, Star Gazer aims to make stargazing accessible, visual, and meaningful — all from your browser.

## How to run

0. **Clone this repo into a directory**

   ```
   git clone https://github.com/cis3296f25/final-project-01-stargazer.git
   ```

1. **Install frontend dependencies**
   ```bash
   npm install
   ```
   > If your network restricts direct npm registry access, configure an internal proxy or mirror before installing.
   > If you receive an error "npm not recognize" install node.js from [Node.js](https://nodejs.org/en/download)

2. **Install backend dependencies**
   Upgrade pip and install requirements
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```
   >if ```requirements.txt``` does not exist, generate one with 
   >   ```
   >   pip freeze > requirements.txt
   >   ``` 

3. **Environment variables**
   Create a `.env` file based on `.env.example` and set your keys:
   ```dotenv
   VITE_GOOGLE_MAPS_API_KEY=
   VITE_API_BASE_URL=http://localhost:5000
   ```
   `VITE_API_BASE_URL` is optional—when omitted the dev server proxies `/api` to `http://localhost:5000`.
   
   **How to get a Google Maps API key:**
   1. Visit the Google Cloud Console: https://console.cloud.google.com/
   2. Create or select a project.
   3. Go to **APIs & Services → Library** and enable:
      - **Maps JavaScript API**
      - (Optional) Places API, Geocoding API, Elevation API
   4. Go to **APIs & Services → Credentials** → **Create Credentials → API Key**.
   5. Copy the key and restrict it:
      - Under **Application restrictions**: choose “HTTP referrers (websites)”.
      - Add:  
        `http://localhost:5173/*`  
        (and your production domain, if any)
      - Under **API restrictions**: restrict to Maps JavaScript API.
   6. Paste the key into `.env` as `VITE_GOOGLE_MAPS_API_KEY=...`.


5. **Start the flask backend**
   On a separate terminal in the same directory
   ```
   python stargazer.py
   ```

6. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open the printed URL (default `http://localhost:5173`). Requests to `/api` are proxied to the Flask backend to avoid CORS issues.


## Running Tests

### Running All Tets
From the project root
```bash
pytest -v
```

### Running Tests With Coverage
1. Install the coverage plugin:
   ```bash
   pip install pytest-cov
   ```
2. Run with coverage reporting:
   ```bash
   pytest --cov=stargazer --cov-report=term-missing
   ```

   - ```--cov=stargazer``` measures coverage for the stargazer module
   - ```--cov-report=term-missing``` shows uncovered lines directly in the terminal
   - Optional: 
      ```bash
      pytest --cov=stargazer --cov-report=html
      ```
      Opens a detailed HTML coverage report in the ```htmlcov/``` folder

## Folder Structure

```
src/
  components/     # Reusable UI building blocks (maps, cards, navbar, etc.)
  context/        # React context for shared location + visibility state
  data/           # Mock constellation list until backend support lands
  lib/            # API client, formatting helpers, and utilities
  pages/          # Routed screens (landing, minimized map, fullscreen map)
  styles/         # Tailwind globals and design tokens
``` 

### How to build
- Use this github repository: ... 
- Specify what branch to use for a more stable release or for cutting edge development.  
- Use InteliJ 11
- Specify additional library to download if needed 
- What file and target to compile and run. 
- What is expected to happen when the app start. 


FOR individuals who are fascinated by the night sky, astrology, and the connection between cosmic events and personal meaning,
WHO want an accessible and visually engaging way to explore how the stars and planets aligned at specific moments in time,
THE Star Gazer is an interactive web application that allows users to visualize celestial arrangements and discover astrological insights for any chosen date and location.
UNLIKE traditional astronomy software or generic horoscope websites,
OUR PRODUCT combines real-time astronomical data with elegant, user-friendly design to create an immersive experience that bridges science, art, and personal reflection.
