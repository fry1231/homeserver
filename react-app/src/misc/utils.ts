import {store} from "../Store";
import {AuthState, refreshAuthToken} from "../reducers/auth";
import {jwtDecode, JwtPayload} from "jwt-decode";


interface TokenPayload extends JwtPayload {
  scopes: string[];
  exp: number;
}

// /** Returns a promise that resolves with token value when the token is refreshed
//  *  Does not trigger new refresh
//  *  Promise rejects if the token's already being refreshed */
// export const refreshFinishedToken = (): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     if (!store.getState().auth.isRefreshing) {
//       console.log('Token is not being refreshed');
//       reject();
//     }
//     const unsubscribe = store.subscribe(() => {
//       console.log('waiting for token refresh');
//       const state = store.getState().auth as AuthState;
//       if (!state.isRefreshing) {
//         unsubscribe();
//         resolve<string>(state.token);
//       }
//     });
//   });
// }


/** Refreshes the token if needed and returns the token
 *  Triggers a refresh if necessary */
export const getNewToken = async (): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const state = store.getState().auth as AuthState;
    if (!state.isRefreshing) {
      // If no refresh is in progress, trigger a new one
      console.log('1_Token is not being refreshed, triggering refresh');
      // store.dispatch(refreshAuthToken())
      //   .then(() => {
      //     console.log('1_Token refreshed');
      //     console.log('1_New token:', state.token.slice(-5));
      //     resolve(state.token);
      //   })
      //   .catch((error) => {
      //     console.error('1_Failed to refresh token');
      //     reject(error);
      //   });
      store.dispatch(refreshAuthToken()).unwrap()
        .then((token) => {
          console.log('1_Token refreshed');
          console.log('1_New token:', token.slice(-5));
          resolve(token);
        });
    } else {
      // If a refresh is in progress, wait for it to finish
      console.log('2_Token is being refreshed, waiting for refresh to finish');
      const unsubscribe = store.subscribe(() => {
        if (!store.getState().auth.isRefreshing) {
          unsubscribe();
          const token = store.getState().auth.token;
          console.log('2_Recieved refreshed token');
          console.log('2_New token:', token.slice(-5));
          resolve(token);
        }
      });
    }
  });
}
//
//   // wait if token is being refreshed
//   try {
//     return await refreshFinishedToken();
//   } catch (e) {
//     // token is not being refreshed, trigger refresh
//     try {
//       return await store.dispatch(refreshAuthToken()).unwrap();
//     } catch (error) {
//       if (error instanceof Error && error.name === 'InvalidTokenError') {
//         // token already refreshed by another request
//         console.log('Token already refreshed by another request, returning new token')
//         const token = store.getState().auth.token;
//         if (token === 'undefined') {
//           console.log("token is undefined (string 'undefined')");
//           store.dispatch({type: 'auth/clearAuthToken'});
//           document.location.href = "/login";
//           throw new Error('Token is undefined');
//         }
//         return store.getState().auth.token;
//       }
//       console.error('Failed to refresh token');
//       throw e;
//     }
//   }
// }


/** Check if the token is expired or invalid
 *  Returns true if so */
export const tokenExpiredOrInvalid = (token: string | null): boolean => {
  let decodedToken: TokenPayload;
  if (!token) {
    return true;
  }
  try {
    decodedToken = jwtDecode<TokenPayload>(token);
  } catch (error) {
    if (error instanceof Error && error.name === 'InvalidTokenError') {
      return true;
    }
  }
  const currentTime = Date.now() / 1000; // Convert to seconds
  console.log('Token is outdated by ', decodedToken.exp - currentTime, ' seconds');
  return decodedToken.exp < currentTime;
}