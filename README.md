# Home Automation Project

This project extends the capabilities of the [MigraineStats Telegram bot](https://github.com/fry1231/migraine_stat), 
providing real-time usage statistics and logs. It also includes a calculation of  estimated arrival times for 
buses to the nearest bus stop using a public API, provides real-time information and irrigation automation for a home hydroponic strawberry farm.


- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)

## Features
- **Authorization**: JWT access and refresh tokens with refresh token rotation. Google OAuth.
- **Real-time Statistics and Logs**: Extends the MigraineStats Telegram bot to provide real-time usage statistics and 
logs using WebSockets and Redis pub/sub.
![](/react-app/public/images/states.png)
![](/react-app/public/images/logs.png)
![](/react-app/public/images/statistics.png)
- **Bus Arrival Times**: Calculates the estimated arrival times of buses to the nearest bus stop using a public API. Real-time updates using Server-Sent Events.
- **Temperature and Humidity Graphs**: Displays ambient temperature and humidity data collected from Arduino-based 
sensors in graphical format.
- ![](/react-app/public/images/main.png)
- **Hydroponic Farm Automation**: Provides information on a home hydroponic strawberry farm (soil temperature and humidity, water level in water tank) and automates the irrigation process.
![](/react-app/public/images/farm.png)
- **Monitoring**: System, VPS, and docker container load monitoring dashboards.
![](/react-app/public/images/dashboard.png)

## Technologies Used

- Backend:
  - **Python**: FastAPI, SQLAlchemy, Ormar(ORM), Strawberry (GraphQL)
  - **Databases**: PostgreSQL, Redis, InfluxDB
- Frontend:
  - React
  - Vite
  - **UI**: Material-UI
  - **State Management**: Redux Toolkit
  - **Charts**: Plotly.js
  - **HTTP**: Axios
  - **GraphQL**: Apollo Client
- **Authentication**: JWT Access + Refresh tokens
- **CI/CD**: GitLab
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Traefik
- **Monitoring**: Prometheus+Grafana
