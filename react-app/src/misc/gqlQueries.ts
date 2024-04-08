import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query {
    users (telegram_ids: $telegram_ids) {
      first_name
      last_name
      user_name
    }
  }
`;