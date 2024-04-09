import { gql } from '@apollo/client';

// telegram_id: string | number;
// last_notified: string;
// notify_every: string | number;
// first_name: string | null;
// last_name: string | null;
// user_name: string | null;
// joined: string;
// timezone: string;
// language: string;
// utc_notify_at: string;
// latitude: number | null;
// longitude: number | null;
//
// n_paincases: number;
// n_druguses: number;
// n_pressures: number;


export const GET_LIST_ENTITIES = ({usersIds, painsIds, drugusesIds, pressuresIds}) =>
  gql`
    query GetListEntities {
      users(telegramIds: ${usersIds}) {
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
        n_paincases
        n_druguses
        n_pressures
      }
      