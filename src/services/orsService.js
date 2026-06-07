import axios from 'axios';

const API_KEY = process.env.REACT_APP_ORS_API_KEY;
const BASE_URL = 'https://api.openrouteservice.org/v2';

export const getRoute = async (start, end) => {
  try {
    const response = await axios.post(`${BASE_URL}/directions/driving-car/geojson`, {
      coordinates: [start, end]
    }, {
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error en ORS:", error);
    throw error;
  }
};