#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <CustomJWT.h>
#include <RunningMedian.h>

#define moisture_power 15
#define water_level_power 14
#define pump 16
#define analog A0
#define ONE_WIRE_BUS 0

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

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

// Network credentials
const char* ssid = "ssid";
const char* password = "123456789";

// JWT auth
char secret[] = "secret";
const char* uuid = "asdfasdfasdsdfsfsdsasdfdsaf";

// other
const int wateringTime = 1000 * 15;   // pump will be on
const int moistureThreshold = 50;     // water plants if soil moisture drops below
const int timeThreshold = 3600 * 5;   // (in seconds) will not water plants if time since last watering does not exceed threshold
const int intervalMinutes = 15;       // delay between sending requests to server
const int interval = 1000 * 60 * intervalMinutes;
const int n = 10;    // how many times ask for data from analog output
time_t lastWateringTime = 0;

RunningMedian soil_median = RunningMedian(intervalMinutes);
RunningMedian wl_median = RunningMedian(intervalMinutes);
RunningMedian temp_median = RunningMedian(intervalMinutes);

DynamicJsonDocument doc(512);
CustomJWT jwt(secret, 256);   // HS256

// Create a list of certificates with the server certificate
X509List cert(IRG_Root_X1);


// ==== Ask sensors n times, average the output
float getAverageAnalog(int pin) {
  float res = 0;
  digitalWrite(pin, HIGH);
  delay(1000);
  for (int i = 0; i < n; i++) {
    res += analogRead(analog);
    delay(100);
  }
  digitalWrite(pin, LOW);
  res /= n;
  return res;
}

// === Json string with sensors data
// Read data every minute during the interval, get median ouput
String sensorsRequest() {
  for (int i = 0; i < intervalMinutes; i++) {
    // Filling array to calculate median
    soil_median.add(getAverageAnalog(moisture_power));
    wl_median.add(getAverageAnalog(water_level_power));
    sensors.requestTemperatures();
    temp_median.add(sensors.getTempCByIndex(0));
    delay(1000 * 60); // one minute delay until the next readings
  }

  float temp_result = temp_median.getMedian();
  float soil_result = soil_median.getMedian();
  float wl_result = wl_median.getMedian();

  temp_median.clear();
  soil_median.clear();
  wl_median.clear();

  String json;
  doc["temperature"] = temp_result;
  doc["soil_moisture"] = soil_result;
  doc["water_level"] = wl_result;
  serializeJson(doc, json);
  doc.clear();
  return json;
}

// Json string with watering duration
String wateringRequest(int seconds) {
  String json;
  doc["duration"] = seconds;
  serializeJson(doc, json);
  doc.clear();
  return json;
}

// === Auth string for JWT
String JWTPayload(time_t future) {
  String begin = "{\"sub\":\"uuid\",\"scopes\":[\"scope:read"],\"exp\":";
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

// Turns on the pump for seconds arg
// Works only when 0 < seconds <= 60
void waterPlants(time_t now, int seconds) {
  if (seconds > 0 && seconds <= 60) {
    digitalWrite(pump, HIGH);
    delay(seconds * 1000);
    digitalWrite(pump, LOW);
    lastWateringTime = now;
  }
}

// returns true if watered
bool waterIfNeeded(time_t now) {
  int timeSinceLastWatering = now - lastWateringTime;
  float h = getAverageAnalog(moisture_power);
  if ((timeSinceLastWatering > timeThreshold) && (h < moistureThreshold) && (h > 20)) {  // h < 20 when no connection
    waterPlants(now, wateringTime);
    return true;
  }
  return false;
}

void blink(int times, int delayTime) {
  digitalWrite(LED_BUILTIN, LOW);
  delay(100);
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(delayTime);
    digitalWrite(LED_BUILTIN, LOW);
    delay(delayTime);
  }
  digitalWrite(LED_BUILTIN, LOW);
}

int POSTreq(WiFiClientSecure client, String authHeader, String url, String payload) {
  HTTPClient https;
  if (https.begin(client, url)) {
    https.addHeader("Content-Type", "application/json");
    https.addHeader("Authorization", authHeader);
    // start connection and send HTTP header
    int httpCode = https.POST(payload);
    // httpCode will be negative on error
    if (httpCode > 0) {
      blink(1, 300);
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
        String payload = https.getString();
      }
    } else {
      // handle error if request unsuccessful
    }
    https.end();
    return httpCode;
  } else {
    return -1;
  }
}

int GETreq(WiFiClientSecure client, String authHeader, String url) {
  HTTPClient https;
  if (https.begin(client, url)) {
    https.addHeader("Content-Type", "application/json");
    https.addHeader("Authorization", authHeader);
    int httpCode = https.GET();
    // httpCode will be negative on error
    if (httpCode > 0) {
      blink(1, 300);
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
        String payload = https.getString();
        return payload.toInt();
      }
    } else {
      // handle if request unsuccessful
    }
    https.end();
    return httpCode;
  } else {
    return -1;
  }
}





// =======================================================================================
void setup() {
  // Serial.begin(9600);

  pinMode(moisture_power, OUTPUT);
  pinMode(water_level_power, OUTPUT);
  pinMode(pump, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);

  sensors.begin();

  //Connect to Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  int i = 0;
  while (WiFi.status() != WL_CONNECTED) {
    blink(1, 1000);
    i++;
    if (i > 120) {
      return;
    }
  }
  WiFi.setAutoConnect(true);
  WiFi.persistent(true);
}




void loop() {
  // get sensors data. ALL DELAY WOULD BE HERE
  // =========================================
  String request = sensorsRequest();
  // =========================================
  time_t now = lastWateringTime;

  bool watered = false;
  // If no wifi connection - autonomous mode
  if (WiFi.status() != WL_CONNECTED) {
    blink(15, 100);
    digitalWrite(LED_BUILTIN, HIGH);
    // watered = waterIfNeeded(now + timeThreshold);       ==================================
    delay(interval);
  }

  // If wifi connected
  if (WiFi.status() == WL_CONNECTED) {
    blink(2, 300);
    // Get current time
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    now = time(nullptr);
    while (now < 24 * 3600) {
      delay(500);
      now = time(nullptr);
    }
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    blink(2, 300);

    WiFiClientSecure client;
    String header = authHeader(now);
    client.setTrustAnchors(&cert);

    // POST data from sensors
    String url = "https://api.example.com/farm/data";
    int response = POSTreq(client, header, url, request);

    // GET last watering time
    url = "https://api.example.com/farm/watering/last";
    response = GETreq(client, header, url);
    if (response != -1) {
      lastWateringTime = response;
    }

    // Check if watering requested from the server
    url = "https://api.example.com/farm/watering/seconds";
    int waterForSeconds = GETreq(client, header, url);
    if (waterForSeconds != 0) {
      waterPlants(now, waterForSeconds);
      // Send watering data to the server
      url = "https://api.example.com/farm/watering/submit";
      request = wateringRequest(waterForSeconds);
      response = POSTreq(client, header, url, request);
    } else {
      // Check if watering needed
      // watered = waterIfNeeded(now);
      // if (watered) {
      //   url = "https://api.example.com/farm/watering/submit";
      //   request = wateringRequest();
      //   response = POSTreq(client, header, url, request);
      // }
    }
  }
}