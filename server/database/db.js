import mongoose  from 'mongoose';

const Connection = async (username = 'jainnikhil7746', password = 'nikhiljain7746') => {
    const URL = `mongodb+srv://${username}:${password}@googledocsclone.otxe1jn.mongodb.net/?retryWrites=true&w=majority&appName=GoogleDocsClone`;

    try {
        await mongoose.connect(URL);
        console.log('Database connected successfully');
    } catch (error) {   
        console.log('Error while connecting with the database ', error);
    }
}
export default Connection;