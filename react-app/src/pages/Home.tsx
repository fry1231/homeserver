import BusArrivals from "../components/BusArrivals";
import Weather from "../components/Weather";
import {Button, Typography} from "@mui/material";
import {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {addWindow} from "../reducers/draggables";
import {PressureProps} from "../components/views/PressureView";
import {DruguseProps} from "../components/views/DruguseView";
import {PaincaseProps} from "../components/views/PaincaseView";
import {UserProps} from "../components/views/UserView";

export default function Home() {
  const paincase: PaincaseProps = {
    id: 0,
    date: "2023-10-06",
    durability: 2,
    intensity: 5,
    aura: false,
    provocateurs: "Недостаточный сон, Пропуск приёма пищи",
    symptoms: "Светочувствительность",
    description: "",
    owner_id: 0,
    medecine_taken: [{
      id: 0,
      date: "",
      amount: "100",
      drugname: "Кетопрофен",
      owner_id: 0,
      paincase_id: 0,
    }],
  };
  const pressure: PressureProps = {
    id: 0,
    datetime: "2023-10-06 15:12:12",
    systolic: 120,
    diastolic: 80,
    pulse: 60,
    owner_id: 0,
  }
  const druguse: DruguseProps = {
    id: 0,
    date: "2013-05-01",
    amount: "100",
    drugname: "Кетопрофен",
    owner_id: 0,
    paincase_id: 0,
  }
  const user: UserProps = {
    telegram_id: "12315611598",
    first_name: "Иван",
    last_name: null,
    user_name: "ivan",
    joined: "2023-10-06",
    timezone: "Europe/Moscow",
    language: "ru",
    notify_every: -1,
    utc_notify_at: "09:00",
    latitude: 55.7558,
    longitude: 37.6176,
    n_paincases: 169,
    n_druguses: 10,
    n_pressures: 1,
  }
  const list: ListViewProps = {
    entities: [paincase,
      pressure,
      {...pressure, id: 1},
      {...pressure, id: 2},
      {...pressure, id: 3},
      {...pressure, id: 4},
      {...pressure, id: 5},
      {...pressure, id: 6},
      {...pressure, id: 7},
      {...pressure, id: 8},
      {...pressure, id: 9},
      druguse, user],
  }
  
  const dispatch = useDispatch();
  return (
    <>
      <Button variant="contained"
              onClick={() => {
                dispatch(addWindow(paincase));
              }}
      style={{zIndex: 1}}>Add Paincase</Button>
      <Button variant="contained"
              onClick={() => {
                dispatch(addWindow(pressure));
              }}
      style={{zIndex: 1}}>Add Pressure</Button>
      <Button variant="contained"
              onClick={() => {
                dispatch(addWindow({name: "Pressure", id: 1}));
              }}
              style={{zIndex: 1}}>Add User</Button>
      <Button variant="contained"
              onClick={() => {
                dispatch(addWindow(druguse));
              }}
      style={{zIndex: 1}}>Add Druguse</Button>
      <Button variant="contained"
              onClick={() => {
                dispatch(addWindow(list));
              }}
              style={{zIndex: 1}}>Add List</Button>
    </>
  );
};
