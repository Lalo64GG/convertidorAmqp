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
  const distancia = req.body.distancia;
  const humedad = req.body.humedad;
  const temperatura = req.body.temperatura;
  console.log('Distancia recibida:', distancia, humedad, temperatura);

  // Guardar los datos en el array
  datosESP32.push({
    distancia: distancia,
    timestamp: new Date().toISOString() // Agregar una marca de tiempo
  });
  // Conexión al servidor AMQP y envío de datos
  amqp.connect('amqp://34.196.166.98/', function(error0, connection) {
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
      const routingKey = 'daniel';
      const messageObject = {
        name: 'encierro 4',
        distancia: distancia,
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
