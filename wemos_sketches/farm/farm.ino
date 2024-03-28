#include <OneWire.h>
#include <DallasTemperature.h>
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

#define moisture_power 14
#define water_level_power 15
#define pump 5
#define analog A0
#define ONE_WIRE_BUS 2

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
WiFiClient client;

int n = 10;
float res = 0;

const char* ssid = "ssid";
const char* password = "pass";
const char* host = "http://{user}:{pass}@homescreen.{domain}/ambiance/submit";  // change to actual
const char* secret = "secret"   // change
const int interval = 1000 * 60 * 5;
DynamicJsonDocument doc(1024);

void setup() {
  Serial.begin(9600);

  pinMode(moisture_power, OUTPUT);
  pinMode(water_level_power, OUTPUT);
  pinMode(pump, OUTPUT);

  sensors.begin();
}


void loop() {
  digitalWrite(moisture_power, HIGH);

  res = analogRead(analog);
  Serial.println(res);

  // digitalWrite(moisture_power, HIGH);
  // delay(500);
  // for (int i = 0; i < n; i++) {
  //   res += analogRead(analog);
  //   delay(100);
  // }                                                                                                                                                        
  // res /= n;
  // Serial.print("Moisture ");
  // Serial.println(res);
  // digitalWrite(moisture_power, LOW);
  // res = 0;

  // digitalWrite(water_level_power, HIGH);
  // delay(500);
  // for (int i = 0; i < n; i++) {
  //   res += analogRead(analog);
  //   delay(100);
  // }
  // res /= n;
  // Serial.print("Water Level ");
  // Serial.println(res);
  // digitalWrite(water_level_power, LOW);
  // res = 0;

  // sensors.requestTemperatures();
  // float tempC = sensors.getTempCByIndex(0);
  // if(tempC != DEVICE_DISCONNECTED_C)
  // {
  //   Serial.print("Temperature for the device 1 (index 0) is: ");
  //   Serial.println(tempC);
  // } 
  //   else
  // {
  //   Serial.println("Error: Could not read temperature data");
  // }

  // Serial.println();
  // Serial.println();
  // Serial.println();

  delay(200);
}
