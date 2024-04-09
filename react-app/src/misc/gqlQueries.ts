import { gql } from '@apollo/client';

export const GET_USERS = ({properties}) => gql`
  query Users ($telegram_ids: [Int!])
    users (telegram_ids: $telegram_ids) {
      ${properties.join(' ')}
    }
  }
`;