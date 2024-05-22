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

// export interface DruguseProps {
//   id: number;
//   date: string;
//   amount: string;
//   drugname: string;
//   owner_id: number;
//   paincase_id: number | null;
// }

// export interface PressureProps {
//   id: number;
//   datetime: string;
//   systolic: number;
//   diastolic: number;
//   pulse: number;
//   owner_id: number;
// }


//          Short views data:
// USER: telegramId, firstName, lastName, userName
// PAINCASE: id, date
// DRUGUSE: id, date
// PRESSURE: id, datetime

export const GET_LIST_ITEMS_SHORT = gql`
    query GetListEntities ($userIds: [BigInt!]!, $painIds: [Int!]!, $druguseIds: [Int!]!, $pressureIds: [Int!]!) {
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
  query GetUserById($id: BigInt!) {
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
        date
      }
      druguses {
        id
        date
      }
      pressures {
        id
        datetime
      }
    }
  }
`;

export const GET_USERS_WITH_COORDINATES = gql`
  query GetUsersWithCoordinates {
    users(hasCoordinates: true) {
      telegramId
      firstName
      lastName
      userName
      latitude
      longitude
    }
  }
`;

export const GET_USERS_SHORT_BY_LANG = gql`
  query GetUserShortBy($language: String) {
    users(language: $language) {
      telegramId
      firstName
      lastName
      userName
      language
    }
  }
`;

export const GET_USERS_SHORT_BY_TZ = gql`
  query GetUserShortBy($timezone: String) {
    users(timezone: $timezone) {
      telegramId
      firstName
      lastName
      userName
      timezone
    }
  }
`;

export const GET_PAINCASES_BY_ID = gql`
  query GetPaincasesById($ids: [Int!]!) {
    paincases(ids: $ids) {
      id
      date
      durability
      intensity
      aura
      provocateurs
      symptoms
      description
      owner {
        telegramId
        firstName
        lastName
        userName
      }
      medecineTaken {
        id
        drugname
        amount
      }
    }
  }
`;

export const GET_DRUGUSES_BY_ID = gql`
  query GetDruguseById($ids: [Int!]!) {
    druguses(ids: $ids) {
      id
      date
      amount
      drugname
      owner {
        telegramId
        firstName
        lastName
        userName
      }
      paincase {
        id
      }
    }
  }
`;

export const GET_PRESSURES_BY_ID = gql`
  query GetPressuresById($ids: [Int!]!) {
    pressures(ids: $ids) {
      id
      datetime
      systolic
      diastolic
      pulse
      owner {
        telegramId
        firstName
        lastName
        userName
      }
    }
  }
`;


export const GET_SUM_STATISTICS_BETWEEN = gql`
  query GetStatisticsBetween($afterDate: Date!, $beforeDate: Date!) {
    statistics(afterDate: $afterDate, beforeDate: $beforeDate, onlySummarized: true) {
      nNewUsers
      nDeletedUsers
      nActiveUsers
      nSuperActiveUsers
      nPaincases
      nDruguses
      nPressures
    }
  }
`;


export const GET_DETAILED_STATISTICS_BETWEEN = gql`
  query GetDetailsStatisticsBetween($afterDate: Date!, $beforeDate: Date!) {
    statistics(afterDate: $afterDate, beforeDate: $beforeDate, onlySummarized: false) {
      newUsers {
        telegramId
        firstName
        lastName
        userName
      }
      deletedUsers {
        telegramId
        firstName
        lastName
        userName
      }
      superActiveUsers {
        telegramId
        firstName
        lastName
        userName
      }
      paincases {
        id
        date
      }
      druguses {
        id
        date
      }
      pressures {
        id
        datetime
      }
    }
  }
`;

export const GET_DAILY_STATISTICS_BETWEEN = gql`
  query GetDailyStatisticsBetween($afterDate: Date!, $beforeDate: Date!) {
    dailyStatistics(afterDate: $afterDate, beforeDate: $beforeDate) {
      afterDate
      nNewUsers
      nDeletedUsers
      nActiveUsers
      nSuperActiveUsers
      nPaincases
      nDruguses
      nPressures
    }
  }
`;