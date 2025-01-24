#include <ArduinoJson.h>
#include <ArduinoJson.hpp>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <SPI.h>
#include <Adafruit_BMP280.h>

//#define BMP_SCK  (13)
//#define BMP_MISO (12)
//#define BMP_MOSI (11)
//#define BMP_CS   (10)

Adafruit_BMP280 bmp; // I2C

const char* ssid = "pikhpb";
const char* password = "password";
const char* mqtt_server = "10.42.0.1";

//const int LED_PIN = 10;  // LED connected to digital pin 13
//unsigned long previousMillis = 0;  // will store last time LED was updated
//const long interval = 250;        // interval at which to blink (milliseconds)

WiFiClient espClient;
PubSubClient client(espClient);

const float maxPressurePa = 106000; // Example max pressure in Pa, adjust as needed
const float minPressurePa = 96000; // Minimum pressure in Pa

void setup() {
  delay(100);
  //Serial.begin(115200);
  //uwhile (!Serial);

  //pinMode(LED_PIN, OUTPUT);

  if (!bmp.begin(0x76)) {
    //Serial.println("Could not find a valid BMP280 sensor, check wiring!");
    while (1);
  }

  
  /* Default settings from datasheet. */
  bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,     /* Operating Mode. */
                  Adafruit_BMP280::SAMPLING_X2,     /* Temp. oversampling */
                  Adafruit_BMP280::SAMPLING_X16,    /* Pressure oversampling */
                  Adafruit_BMP280::FILTER_X16,      /* Filtering. */
                  Adafruit_BMP280::STANDBY_MS_63); /* Standby time. */

  // We start by connecting to a WiFi network
  //Serial.println();
  //Serial.print("Connecting to ");
  //Serial.println(ssid);

  //WiFi.begin(ssid, password);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    //Serial.print(".");
  }

  //Serial.println("");
  //Serial.println("WiFi connected");
  //Serial.println("IP address: ");
  //Serial.println(WiFi.localIP());

  client.setServer(mqtt_server, 1883);
}

void loop() {

long lastMsg = 0;

// Blink without delay
//unsigned long currentMillis = millis();

//if (currentMillis - previousMillis >= interval) {
   // save the last time you blinked the LED 
  //previousMillis = currentMillis;   

    // if the LED is off turn it on and vice-versa:
 // if (digitalRead(LED_PIN) == LOW) {
   // digitalWrite(LED_PIN, HIGH);
 // } else {
   // digitalWrite(LED_PIN, LOW);
 // }
//}

  if (!client.connected()) {
    reconnect();
  }

  StaticJsonDocument<80> doc;
  char output[80];

    long now = millis();
  if (now - lastMsg > 100) {
    lastMsg = now;
    //float temp = bmp.readTemperature();
    //float pressure = bmp.readPressure()/100.0;
    float pressure = bmp.readPressure();
    //float humidity = bme.readHumidity();
    //float gas = bme.readGas()/1000.0;
    //doc["t"] = temp;

   int pressurePercentage = constrain(map(pressure, minPressurePa, maxPressurePa, 0, 100), 0, 100);
   //int pressurePercentage = map(pressure, minPressurePa, maxPressurePa, 0, 100);

    doc["p"] = pressurePercentage;
    //doc["p"] = pressure;
    //doc["h"] = humidity;
    //doc["g"] = gas;

    serializeJson(doc, output);
    //Serial.println(output);
    client.publish("bagpipes/p1", output, 0);
  }
    
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    //Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      //Serial.println("connected");
    } else {
      //Serial.print("failed, rc=");
      //Serial.print(client.state());
      delay(500);
    }
  }
}