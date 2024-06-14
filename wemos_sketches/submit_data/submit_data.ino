#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <GyverOLED.h>
#include "DHT.h"
#include <CustomJWT.h>

#define DHTPIN 12

const char* ssid = "ssid";
const char* password = "123456789";

// JWT auth
char secret[] = "secret";
const char* uuid = "uuid";
const char* url = "https://api.example.com/api/v1/room1/state/";
const int interval = 1000 * 60 * 5;

DHT dht(DHTPIN, DHT22);
WiFiClient client;
GyverOLED<SSD1306_128x32, OLED_BUFFER> oled;
CustomJWT jwt(secret, 256);   // HS256
DynamicJsonDocument doc(1024);

// Root certificate for letsencrypt
const char IRG_Root_X1 [] PROGMEM = R"CERT(
-----BEGIN CERTIFICATE-----
MIIFYDCCBEigAwIBAgIQQAF3ITfU6UK47naqPGQKtzANBgkqhkiG9w0BAQsFADA/
MSQwIgYDVQQKExtEaWdpdGFsIFNpZ25hdHVyZSBUcnVzdCBDby4xFzAVBgNVBAMT
DkRTVCBSb290IENBIFgzMB4XDTIxMDEyMDE5MTQwM1oXDTI0MDkzMDE4MTQwM1ow
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwggIiMA0GCSqGSIb3DQEB
AQUAA4ICDwAwggIKAoICAQCt6CRz9BQ385ueK1coHIe+3LffOJCMbjzmV6B493XC
ov71am72AE8o295ohmxEk7axY/0UEmu/H9LqMZshftEzPLpI9d1537O4/xLxIZpL
wYqGcWlKZmZsj348cL+tKSIG8+TA5oCu4kuPt5l+lAOf00eXfJlII1PoOK5PCm+D
LtFJV4yAdLbaL9A4jXsDcCEbdfIwPPqPrt3aY6vrFk/CjhFLfs8L6P+1dy70sntK
4EwSJQxwjQMpoOFTJOwT2e4ZvxCzSow/iaNhUd6shweU9GNx7C7ib1uYgeGJXDR5
bHbvO5BieebbpJovJsXQEOEO3tkQjhb7t/eo98flAgeYjzYIlefiN5YNNnWe+w5y
sR2bvAP5SQXYgd0FtCrWQemsAXaVCg/Y39W9Eh81LygXbNKYwagJZHduRze6zqxZ
Xmidf3LWicUGQSk+WT7dJvUkyRGnWqNMQB9GoZm1pzpRboY7nn1ypxIFeFntPlF4
FQsDj43QLwWyPntKHEtzBRL8xurgUBN8Q5N0s8p0544fAQjQMNRbcTa0B7rBMDBc
SLeCO5imfWCKoqMpgsy6vYMEG6KDA0Gh1gXxG8K28Kh8hjtGqEgqiNx2mna/H2ql
PRmP6zjzZN7IKw0KKP/32+IVQtQi0Cdd4Xn+GOdwiK1O5tmLOsbdJ1Fu/7xk9TND
TwIDAQABo4IBRjCCAUIwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAQYw
SwYIKwYBBQUHAQEEPzA9MDsGCCsGAQUFBzAChi9odHRwOi8vYXBwcy5pZGVudHJ1
c3QuY29tL3Jvb3RzL2RzdHJvb3RjYXgzLnA3YzAfBgNVHSMEGDAWgBTEp7Gkeyxx
+tvhS5B1/8QVYIWJEDBUBgNVHSAETTBLMAgGBmeBDAECATA/BgsrBgEEAYLfEwEB
ATAwMC4GCCsGAQUFBwIBFiJodHRwOi8vY3BzLnJvb3QteDEubGV0c2VuY3J5cHQu
b3JnMDwGA1UdHwQ1MDMwMaAvoC2GK2h0dHA6Ly9jcmwuaWRlbnRydXN0LmNvbS9E
U1RST09UQ0FYM0NSTC5jcmwwHQYDVR0OBBYEFHm0WeZ7tuXkAXOACIjIGlj26Ztu
MA0GCSqGSIb3DQEBCwUAA4IBAQAKcwBslm7/DlLQrt2M51oGrS+o44+/yQoDFVDC
5WxCu2+b9LRPwkSICHXM6webFGJueN7sJ7o5XPWioW5WlHAQU7G75K/QosMrAdSW
9MUgNTP52GE24HGNtLi1qoJFlcDyqSMo59ahy2cI2qBDLKobkx/J3vWraV0T9VuG
WCLKTVXkcGdtwlfFRjlBz4pYg1htmf5X6DYO8A4jqv2Il9DjXA6USbW1FzXSLr9O
he8Y4IWS6wY7bCkjCWDcRQJMEhg76fsO3txE+FiYruq9RUWhiF1myv4Q6W+CyBFC
Dfvp7OOGAN6dEOM4+qR9sdjoSYKEBpsr6GtPAQw4dy753ec5
-----END CERTIFICATE-----
)CERT";

// Create a list of certificates with the server certificate
X509List cert(IRG_Root_X1);


// === Auth string for JWT
String JWTPayload(time_t future) {
  String begin =  "{\"sub\":\"{\\\"uuid\\\":\\\"db5fb3ab409845a2b16f94f835e15559\\\",\\\"is_admin\\\":true}\",\"exp\":";
  String end = "}";
  String result = begin + future + end;
  return result;
}

// === Auth header with bearer token
String authHeader(time_t now) {
  time_t future = now + 3600;   // exp time 1h
  jwt.allocateJWTMemory();
  String payload = JWTPayload(future);
  int len = payload.length() + 1;
  char ch_payload[len];
  payload.toCharArray(ch_payload, len);
  jwt.encodeJWT(ch_payload);
  String token = jwt.out;
  String authHeaderStr = "Bearer " + token;
  jwt.clear();
  return authHeaderStr;
}

int POSTreq(WiFiClientSecure client, String authHeader, String url, String payload) {
  HTTPClient https;

  Serial.print("[HTTPS] begin...\n");
  if (https.begin(client, url)) { 
    https.addHeader("Content-Type", "application/json");
    https.addHeader("Authorization", authHeader);

    
    Serial.print("[HTTPS] POST...\n");
    // start connection and send HTTP header
    int httpCode = https.POST(payload);

    // httpCode will be negative on error
    if (httpCode > 0) {
      // HTTP header has been send and Server response header has been handled
      Serial.printf("[HTTPS] POST... code: %d\n", httpCode);

      // file found at server
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
        String payload = https.getString();
        Serial.println(payload);
      }
    } else {
      Serial.printf("[HTTPS] GET... failed, error: %s\n", https.errorToString(httpCode).c_str());
    }

    https.end();
    return httpCode;
  } else {
    Serial.printf("[HTTPS] Unable to connect\n");
    return -1;
  }
}

// ====================================================
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
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    Serial.print("Waiting for NTP time sync: ");
    time_t now = time(nullptr);
    while (now < 24 * 3600) {
      delay(500);
      Serial.print(".");
      now = time(nullptr);
    }
    Serial.println("");
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    Serial.print("Current time: ");
    Serial.println(asctime(&timeinfo));

    WiFiClientSecure client;
    String header = authHeader(now);
    client.setTrustAnchors(&cert);
    String request = getStates(t, h);

    int response = POSTreq(client, header, url, request);

    if (response == 200) {
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