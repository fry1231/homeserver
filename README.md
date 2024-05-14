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
  - **Python**: FastAPI, Pydantic, SQLAlchemy, Ormar (ORM), Strawberry (GraphQL)
  - **Databases**: PostgreSQL, Redis
- Frontend:
  - React
  - Vite
  - **UI Framework**: Material-UI
  - **State Management**: Redux Toolkit
  - **Charts**: Plotly.js
  - **HTTP Client**: Axios
  - **GraphQL Client**: Apollo Client
  - **Form Validation**: React Hook Form
  - **Authentication**: JWT
  - **Websockets**: Socket.IO
  - **Styling**: SCSS
  - **Linting**: ESLint, Prettier
  - **Testing**: Jest, React Testing Library
  - **Deployment**: Vercel
- **CI/CD**: GitLab
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Traefik

## Project Structure

The project is divided into several parts:

- `react-app/src/pages/Statistics.tsx`: This file contains the React component for displaying the statistics page.
- `react-app/src/App.tsx`: This is the main React application file. It sets up the Redux store and configures the 
application's routes.
- `react-app/src/components/FarmChart.tsx`: This file contains the React component for displaying the farm chart.
- `app/routers/users.py`: This file contains the FastAPI routes for user registration and authentication.