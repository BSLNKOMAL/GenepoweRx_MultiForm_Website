const mongoose = require('mongoose');

let clientsConnection = null;

const connectClientsDB = async () => {
  if (clientsConnection) return clientsConnection;
  try {
    clientsConnection = await mongoose.createConnection(
      process.env.CLIENTS_DB_URI || 'mongodb://localhost:27017/genepowerx_clients'
    );
    console.log('✅ genepowerx_clients DB connected');
    return clientsConnection;
  } catch (error) {
    console.error('❌ genepowerx_clients DB Error:', error.message);
    throw error;
  }
};

module.exports = connectClientsDB;