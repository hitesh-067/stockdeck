# Stock Profit Maximization System

A full-stack web application designed to help users analyze stock trades and maximize profits using Dynamic Programming. The platform features a premium fintech-inspired UI with a dark/light mode glassmorphism design.

## Features

- **User Authentication**: Secure registration and login.
- **Premium UI**: Glassmorphism, modern typography, realistic Wall Street charging bull hero, dark/light theme persistence.
- **Dashboard**: Track Total Calculations, Net Profit, Top Stock, and visualize profit/loss distribution via Chart.js.
- **Calculator**: Calculate and save profit/loss of individual trades.
- **History**: View and manage all saved transactions.
- **Strategy Analyzer**: Implements Dynamic Programming (O(n) time, O(1) space) to find the maximum profit obtainable from a sequence of stock prices, providing BUY and SELL signals visually.

## Tech Stack

- **Backend**: Java 17, Spring Boot, Spring Data JPA, Hibernate
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Chart.js
- **Build Tool**: Maven

## Deployment on Railway

1. Push this repository to GitHub.
2. In Railway, create a new project and select "Deploy from GitHub repo".
3. Add a MySQL Database plugin in the Railway project.
4. Go to your Spring Boot service variables and add the following:
   - `PORT`: 8080 (or any port Railway provides)
   - `DB_URL`: The JDBC URL from the MySQL plugin (e.g., `jdbc:mysql://...`)
   - `DB_USER`: Database username
   - `DB_PASSWORD`: Database password
5. Railway will automatically detect the `pom.xml`, build the Maven project, and serve the application!

## Running Locally

1. Create a MySQL database named `stockdeck`.
2. Configure `application.properties` with your local MySQL credentials.
3. Run `mvn spring-boot:run`.
4. Access the application at `http://localhost:8080`.
