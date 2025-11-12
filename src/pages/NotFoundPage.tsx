import { css } from '@linaria/core';
import { EmptyState } from 'clad-ui';
import { Link } from 'react-router-dom';
import theme from 'clad-ui/theme';
import { sx } from 'clad-ui/utils';

const pageClass = css`
  background-color: ${theme.colors.backgroundPrimary};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  ${sx({
    px: 'sm',
    py: 'lg',
  })}
`;

const NotFoundPage = () => {
  return (
    <div className={pageClass}>
      <EmptyState buttonLabel="Go back home" type="notFound" />
      <div style={{ marginTop: theme.space.lg }}>
        <Link to="/">Return to Home</Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
