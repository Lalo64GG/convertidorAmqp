const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ruta para recibir datos del ESP32
app.post('/esp32', (req, res) => {
  const distancia = req.body.distancia;
  console.log('Distancia recibida:', distancia);

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
        distancia: distancia
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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});