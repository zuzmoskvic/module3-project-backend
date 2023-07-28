# module3-project-backend

This is the backend of the Final Project for Ironhack Bootcamp by Zuzana & Mauricio for website called "Too Lazy to Type".
The backend is built using Node.js and Express.js, with MongoDB as the database. It provides a RESTful API to interact with the data.
See the deployed project here: https://too-lazy-to-type.netlify.app/

## Prerequisites

Before running the project, make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org)
- [MongoDB](https://www.mongodb.com)

## Getting Started

Follow these instructions to get the project up and running on your local machine:

1. **Clone the repository:**

   ```
   git clone https://github.com/zuzmoskvic/module3-project-backend.git
   ```

2. **Navigate to the project directory:**

   ```
   cd module3-project-backen
   ```

3. **Install the dependencies:**

   ```
   npm install
   ```

4. **Set up the environment variables:**

   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/mern-backend-example
   ```

5. **Start the server:**

   ```
   npm run dev
   ```

The server should now be running at http://localhost:5000.

## API Endpoints

- **POST** `/signup`: Create a new user with an image (multipart form data).
- **POST** `/login`: Authenticate user and generate a JWT.
- **GET** `/verify`: Verify user's JWT and return info with image.
- **POST** `/profile`: Delete user's account (authenticated).
- **GET** `/editUser/:userId`: Get a user by ID (authenticated).
- **PUT** `/editUser/:userId`: Update a user by ID (authenticated).
- **POST** `/deleteUser/:userId`: Delete a user by ID (authenticated).
- **POST** `/addRecord`: Upload and transcribe audio file (authenticated).
- **GET** `/write`: Generate feedback text based on last transcript (authenticated).
- **GET** `/transcription`: Get last recorded transcript (authenticated).
- **POST** `/record`: Upload recorded audio file and associate it with the user (authenticated).
- **GET** `/display`: Get all records associated with the user (authenticated).
- **POST** `/display`: Delete a specific record (authenticated).
- **POST** `/deletetext`: Delete a specific written text (authenticated).
- **GET** `/profile`: Get user's profile info (authenticated).
- **GET** `/private-page`: Get private data associated with the user (authenticated).


## Project Structure

The project follows a simple structure:

- `index.js`: The entry point of the application, where the server is initialized.
- `routes/api/users.js`: Defines the routes for handling user-related operations.
- `controllers/userController.js`: Contains the controller functions for user-related operations.
- `models/User.js`: Defines the MongoDB schema for the User collection.
- `middlewares/errorHandler.js`: Custom error handling middleware.
- `middlewares/validateRequest.js`: Request validation middleware.

Feel free to modify the project structure and add more features as per your requirements.

## Contributors:

 Mauricio Benavente Ibañez (mauricio9797) & Zuzana Moskvic (zuzmoskvic). Ping us on GitHub if you have any feedback!

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- Special thanks to Ironhack for making this happen! 
- Project built with IronLauncher
- Audio and image upload via Cloudinary
- Transcription via Whisper OpenAI, written text via Chat Completion by OpenAI 

Happy coding!
