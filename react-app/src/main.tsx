import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import {BrowserRouter} from "react-router-dom";
import {DevSupport} from "@react-buddy/ide-toolbox";
import {useInitial} from "./dev";
// import {ComponentPreviews, useInitial} from "./dev";

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  // </React.StrictMode>
)
