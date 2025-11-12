import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { Button, Breadcrumbs } from 'clad-ui';
import { sx } from 'clad-ui/utils';
import { Link } from 'react-router-dom';
import CladUiDemo from '../components/CladUiDemo';
import theme from 'clad-ui/theme';

// scoped class-based CSS

const detailViewClass = css`
  background-color: ${theme.colors.backgroundPrimary};

  ${sx({
    px: 'sm',
    py: 'lg',
  })}
`;

const buttonGroupClass = css`
  display: flex;
  align-items: center;

  & > * {
    margin-right: ${theme.space.sm};
  }
`;

// styled component
const Title = styled.h1`
  color: ${theme.colors.textBrand};
`;

const DetailView = () => (
  <article>
    <section className={detailViewClass}>
      <Breadcrumbs>
        <a href="/">Home Page</a>
        <a href="/123.htm">Adview Page</a>
      </Breadcrumbs>
      <Title>This is adview page</Title>
      <p className={buttonGroupClass}>
        <Link to="/">
          <Button>Home</Button>
        </Link>
        <Button color="primary" variant="outline">
          Test Page Props
        </Button>
      </p>
      <p>Above is Server Component</p>
      <hr />
    </section>
    {/* client component: */}
    <CladUiDemo />
  </article>
);

export default DetailView;
