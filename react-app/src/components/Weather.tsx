const weatherShort = '<div id="weather"><div id="ww_b98dfdb5c11fa" v="1.3" loc="id" a="{"t":"horizontal","lang":"en","sl_lpl":1,"ids":["wl7545"],"font":"Arial","sl_ics":"one_a","sl_sot":"celsius","cl_bkg":"#FFFFFF00","cl_font":"rgba(255,255,255,1)","cl_cloud":"#d4d4d4","cl_persp":"#2196F3","cl_sun":"#FFC107","cl_moon":"#FFC107","cl_thund":"#FF5722"}">Weather Data Source: <a href="https://meteolabs.fr/meteo_rueil-malmaison/demain/" id="ww_b98dfdb5c11fa_u" target="_blank">météo à Rueil-Malmaison demain</a></div></div>'
const weatherDet = '<div id="weatherDetailed"><div id="ww_8de6bcd2bdab1" v="1.3" loc="id" a="{"t":"responsive","lang":"en","sl_lpl":1,"ids":["wl7545"],"font":"Arial","sl_ics":"one_a","sl_sot":"celsius","cl_bkg":"#FFFFFF00","cl_font":"rgba(255,255,255,1)","cl_cloud":"#d4d4d4","cl_persp":"#2196F3","cl_sun":"#FFC107","cl_moon":"#FFC107","cl_thund":"#FF5722","el_nme":3,"el_ctm":3,"el_cwi":3,"cl_odd":"#00000000"}">Weather Data Source: <a href="https://meteolabs.fr/meteo_rueil-malmaison/demain/" id="ww_8de6bcd2bdab1_u" target="_blank">météo à Rueil-Malmaison demain</a></div></div>'

export default function Weather() {
  return (
    <>
      <div dangerouslySetInnerHTML={{__html: weatherShort}} />
      <div dangerouslySetInnerHTML={{__html: weatherDet}} />
    </>
  );
};