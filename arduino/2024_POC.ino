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

const float maxPressurePa = 120000; // Example max pressure in Pa, adjust as needed
const float minPressurePa = 95000; // Minimum pressure in Pa

static void WiFiEvent(WiFiEvent_t event) {
  switch(event) {
    case IP_EVENT_STA_GOT_IP:
      Serial.println("WiFi connected");
      Serial.println("IP address: ");
      Serial.println(WiFi.localIP());
      break;
    case WIFI_EVENT_STA_DISCONNECTED:
      Serial.println("WiFi lost connection");
      WiFi.begin(ssid, password);
      break;
  }
}

void setup() {
  delay(100);
  Serial.begin(115200);
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


  // Set WiFi mode to Station mode
  WiFi.mode(WIFI_STA);

  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  WiFi.onEvent(WiFiEvent);
  WiFi.begin(ssid, password);

  client.setServer(mqtt_server, 1883);
  client.setKeepAlive(30); // Set keep-alive to 30 seconds
}

void loop() {
  static long lastMsg = 0;
  static unsigned long lastReconnectAttempt = 0;
  static unsigned int reconnectAttemptDelay = 100;

  if (!client.connected()) {
    reconnect();
  }

  long now = millis();
  if (now - lastMsg > 100) { // Consider if this interval can be increased
    lastMsg = now;
    float pressure = bmp.readPressure();
    int pressurePercentage = constrain(map(pressure, minPressurePa, maxPressurePa, 0, 100), 0, 100);

    StaticJsonDocument<32> doc; // Reduced size since we're only sending 'p'
    doc["p"] = pressurePercentage;

    char output[32];
    serializeJson(doc, output);
    client.publish("bagpipes/p2", output, 0);
  }
    
  client.loop(); // Don't forget to call this to maintain the MQTT connection
}


unsigned long lastReconnectAttempt = 0;
unsigned int reconnectAttemptDelay = 50; // Start with 100ms
const unsigned int maxReconnectDelay = 2000; // Max delay of 2 seconds

void reconnect() {
  // Check if WiFi is connected first
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    delay(200); // You might want to adjust this delay too
  }

  // Loop until we're reconnected to MQTT
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      reconnectAttemptDelay = 100; // Reset delay on successful connection
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(reconnectAttemptDelay);
      reconnectAttemptDelay = min(reconnectAttemptDelay * 2, maxReconnectDelay);
    }
  }
}