const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
let datosESP32 = [];

// Ruta para recibir datos del ESP32
app.post('/esp32', (req, res) => {
  const temperatura = req.body.temperatura;
  const humedad = req.body.humedad;
  const distancia_1 = req.body.distancia_1;
  const distancia_2 = req.body.distancia_2;
  const distancia_3 = req.body.distancia_3;
  
  console.log('Distancia recibida:', humedad, temperatura, distancia_1, distancia_2, distancia_3);

  // Guardar los datos en el array
  // Guardar los datos en el array con el cálculo del porcentaje
datosESP32.push({
  temperatura,
  humedad,
  distancia_1,
  distancia_2,
  distancia_3,
  porcentaje_distancia_1: calcularPorcentaje(distancia_1),
  porcentaje_distancia_2: calcularPorcentaje(distancia_2),
  porcentaje_distancia_3: calcularPorcentaje(distancia_3),
  timestamp: new Date().toISOString() // Agregar una marca de tiempo
});

// Función para calcular el porcentaje según la distancia y devolverlo como cadena de texto con el símbolo de %
function calcularPorcentaje(distancia) {
  let porcentaje;
  if (distancia >= 10) {
    porcentaje = '20%';
  } else if (distancia >= 5) {
    porcentaje = '100%';
  } else {
    porcentaje = ((distancia / 10) * 100).toFixed(2) + '%'; // Porcentaje relativo al valor máximo (10)
  }
  return porcentaje;
}

  // Conexión al servidor AMQP y envío de datos
  amqp.connect('amqp://52.205.27.36/', function(error0, connection) {
    if (error0) {
      console.error('Error en la conexión AMQP:', error0);
      return res.status(500).send('Error en la conexión AMQP');
    }
    connection.createChannel(function(error1, channel) {
      if (error1) {
        console.error('Error al crear el canal AMQP:', error1);
        return res.status(500).send('Error al crear el canal AMQP');
      }

      const exchange = 'amq.topic';
      const routingKey = 'esp32.mqtt';
      const messageObject = {
        temperature :temperatura,
        humidity:humedad,
        food:calcularPorcentaje(distancia_1),
        water:calcularPorcentaje(distancia_2),
        enclosureId: 44,
        datoId: 2,
        date: new Date().toISOString() 
      };
      const msg = JSON.stringify(messageObject);
      channel.publish(exchange, routingKey, Buffer.from(msg));
      console.log('Datos enviados al servidor AMQP:', msg);

      // Cerrar conexión y responder al cliente
      setTimeout(function() {
        connection.close();
        console.log('Conexión AMQP cerrada');
        res.send('Datos recibidos correctamente');
      }, 500);
    });
  });
});

// Ruta GET para acceder a los datos guardados
app.get('/datos', (req, res) => {
    res.json(datosESP32);
  });

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
