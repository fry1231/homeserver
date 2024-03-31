import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import {BrowserRouter} from "react-router-dom";
import {DevSupport} from "@react-buddy/ide-toolbox";
// import {ComponentPreviews, useInitial} from "./dev";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    {/*<DevSupport ComponentPreviews={ComponentPreviews}*/}
    {/*            useInitialHook={useInitial}*/}
    {/*>*/}
      <App/>
    {/*</DevSupport>*/}
  </BrowserRouter>
  // <React.StrictMode>
  //   <BrowserRouter>
  //     <DevSupport ComponentPreviews={ComponentPreviews}
  //                 useInitialHook={useInitial}
  //     >
  //       <App/>
  //     </DevSupport>
  //   </BrowserRouter>
  // </React.StrictMode>,
)
