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
    query GetListEntities {
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
  query GetUserById($id: ID!) {
    user(telegramId: $id) {
      telegram_id
      last_notified
      notify_every
      first_name
      last_name
      user_name
      joined
      timezone
      language
      utc_notify_at
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