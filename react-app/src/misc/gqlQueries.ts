import { gql } from '@apollo/client';
import {DruguseProps} from "../components/views/DruguseView";


// export interface UserProps {
//   telegram_id: string | number;
//   last_notified: string;
//   notify_every: string | number;
//   first_name: string | null;
//   last_name: string | null;
//   user_name: string | null;
//   joined: string;
//   timezone: string;
//   language: string;
//   utc_notify_at: string;
//   latitude: number | null;
//   longitude: number | null;
//
//   n_paincases: number;
//   n_druguses: number;
//   n_pressures: number;
// }

// export interface PaincaseProps {
//   id: number;
//   date: string;
//   durability: number;
//   intensity: number;
//   aura: boolean;
//   provocateurs: string | null;
//   symptoms: string | null
//   description: string | null;
//   owner_id: number;
//   medecine_taken: DruguseProps[] | null;
// }


//          Short views data:
// USER: telegramId, firstName, lastName, userName
// PAINCASE: id, date
// DRUGUSE: id, date
// PRESSURE: id, datetime

export const GET_LIST_ITEMS_SHORT = gql`
    query GetListEntities ($userIds: [Int!]!, $painIds: [Int!]!, $druguseIds: [Int!]!, $pressureIds: [Int!]!) {
      users(telegramIds: $userIds) {
        telegramId
        firstName
        lastName
        userName
      }
      paincases(ids: $painIds) {
        id
        date
      }
      druguses(ids: $druguseIds) {
        id
        date
      }
      pressures(ids: $pressureIds) {
        id
        datetime
      }
    }
  `;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: Int!) {
    user(telegramId: $id) {
      telegramId
      lastNotified
      notifyEvery
      firstName
      lastName
      userName
      joined
      timezone
      language
      utcNotifyAt
      latitude
      longitude
     
      paincases {
        id
      }
      druguses {
        id
      }
      pressures {
        id
      }
    }
  }
`;