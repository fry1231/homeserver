# Home Automation Project

This project extends the capabilities of the [MigraineStats Telegram bot](https://github.com/fry1231/migraine_stat), 
providing real-time usage statistics and logs. It also includes a feature for calculating estimated arrival times for 
buses to the nearest bus stop using a public API. Additionally, the project provides real-time information and 
automation for a home hydroponic strawberry farm.


- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)

## Features

- **Real-time Statistics and Logs**: Extends the MigraineStats Telegram bot to provide real-time usage statistics and 
logs.
- **Bus Arrival Times**: Calculates the estimated arrival times of buses to the nearest bus stop using a public API.

- **Temperature and Humidity Graphs**: Displays ambient temperature and humidity data collected from Arduino-based 
sensors in graphical format.
- **Hydroponic Farm Automation**: Provides real-time information on a home hydroponic strawberry farm and automates 
the irrigation process.

## Technologies Used

- Backend:
  - **Python**: FastAPI, Pydantic, SQLAlchemy, Ormar, Strawberry
  - **Databases**: PostgreSQL, Redis
- Frontend:
  - React
  - Vite
  - **UI Framework**: Material-UI
  - **State Management**: Redux Toolkit
  - **Charts**: Plotly.js
  - **HTTP Client**: Axios
  - **GraphQL Client**: Apollo Client
  - **Authentication**: JWT
- **CI/CD**: GitLab
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Traefik

## Project Structure
