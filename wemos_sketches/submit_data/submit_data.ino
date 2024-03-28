#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <GyverOLED.h>
#include "DHT.h"
#define DHTPIN 12

DHT dht(DHTPIN, DHT22);
WiFiClient client;
GyverOLED<SSD1306_128x32, OLED_BUFFER> oled;

const char* ssid = "ssid";
const char* password = "pass";
const char* host = "http://{user}:{pass}@homescreen.fry1231.net/ambiance/submit";
const int interval = 1000 * 60 * 5;
DynamicJsonDocument doc(1024);

void setup() {
  Serial.begin(115200);
  delay(100);
  dht.begin();
  // connecting to a WiFi network
  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  oled.init();
  oled.clear();
  oled.update();

  // --------------------------
  oled.home();
  oled.print("Initializing...!");  
  oled.update();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  pinMode(LED_BUILTIN, OUTPUT);

  digitalWrite(LED_BUILTIN, 0);
  delay(250);
  digitalWrite(LED_BUILTIN, 1);
  delay(250);
  digitalWrite(LED_BUILTIN, 0);
  delay(250);
  digitalWrite(LED_BUILTIN, 1);
  delay(250);
  digitalWrite(LED_BUILTIN, 0);
  delay(250);
  digitalWrite(LED_BUILTIN, 1);
}

void loop() {
  pinMode(LED_BUILTIN, OUTPUT);
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  oled.clear();
  oled.setCursor(20, 0);
  oled.setScale(2);
  if (isnan(h) || isnan(t)) {
    oled.home();
    oled.print("Sensor error!");
    oled.update();
    return;
  }

  float abs_h = 6.112 * exp(17.67 * t / (t + 243.5)) * h * 2.1674 / (273.15 + t);
  oled.print(t, 1);
  oled.print("*C");
  oled.setCursor(0, 2.5);
  oled.print(h, 1);
  oled.print("% ");
  oled.print(abs_h, 1);
  oled.update();

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(client, host);
    http.addHeader("Content-Type", "application/json");
    String request = getStates(t, h);
    Serial.println(request);
    int httpCode = http.POST(request);
    if (httpCode == 200) {
      Serial.println("Successfully sent");
    } else {
      Serial.println("Unable to request");
    }
  } else {
    oled.clear();
    oled.setCursor(20, 0);
    oled.setScale(2);
    oled.print("No conn.");
  }
  delay(interval);
}

String getStates(float t, float h) {
  String json;
  doc["room_name"] = "room1";
  doc["temperature"] = t;
  doc["rel_humidity"] = h;
  serializeJson(doc, json);
  return json;
}