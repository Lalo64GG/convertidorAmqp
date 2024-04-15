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
  const nivel_luz = req.body.nivel_luz;
  
  console.log('Distancia recibida:', distancia, humedad, temperatura);

  // Guardar los datos en el array
  datosESP32.push({
    temperatura,
    humedad,
    nivel_luz,
    timestamp: new Date().toISOString() // Agregar una marca de tiempo
  });
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
        name: 'encierro 4',
        temperatura: temperatura,
        humedad: humedad,
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
