import React from 'react';
import styled, { css } from 'styled-components';
import { NavLink, NavRoute } from 'react-navi';
import cdpTypesConfig from 'references/cdpTypes';
import { Flex, Text } from '@makerdao/ui-components';

import RatioDisplay from './navbar/RatioDisplay';
import MakerLogo from '../images/maker.svg';
import { ReactComponent as MakerSmall } from '../images/maker-small.svg';

const _shownCDPTypes = cdpTypesConfig.filter(({ hidden }) => !hidden);
const shownCDPTypes = _shownCDPTypes.map(cdpType => ({
  ...cdpType,
  ratio: (Math.random() * 1000).toFixed(2)
}));

const StyledMakerLogo = styled.div`
  display: block;
  cursor: pointer;
  width: 33px;
  height: 21px;
  background: url(${MakerLogo}) center no-repeat;
  margin: 23px auto 32px;
  background-size: 33px;
`;

const StyledNavbar = styled.div`
  grid-area: navbar;
  background: #222;
`;

const NavbarItemContainer = styled(NavLink)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66px;
  height: 54px;
  margin: 0 auto;
  margin-bottom: 10px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  color: #f8f8f8;
  ${({ active }) =>
    active
      ? css`
          background: #1aab9b;
          svg {
            opacity: 1;
          }
        `
      : css`
          background: #383838;
          svg {
            opacity: 0.3;
          }
        `};
  &:active {
    background: #1aab9b !important;
    svg {
      opacity: 1 !important;
    }
  }
`;

const DelegateStyle = styled.div`
  &:active > a:not(:active) {
    background: #383838 !important;
    svg {
      opacity: 0.3 !important;
    }
  }
`;

function CDPListView({ currentPath, currentQuery }) {
  let pathPrefix = '';
  if (currentPath.includes('read-only')) pathPrefix = '/read-only';
  else if (currentPath.includes('sandbox')) pathPrefix = '/sandbox';

  return (
    <DelegateStyle>
      <NavbarItem
        key="overview"
        href={`${pathPrefix}/overview/${currentQuery}`}
        label="Overview"
        Logo={MakerSmall}
        active={currentPath.includes('/overview/')}
      />
      {shownCDPTypes.map((cdp, idx) => {
        const linkPath = `/cdp/${cdp.slug}/`;
        const active = currentPath.includes(linkPath);
        return (
          <NavbarItem
            key={idx}
            href={pathPrefix + linkPath + currentQuery}
            label={cdp.symbol}
            ratio={cdp.ratio}
            active={active}
          />
        );
      })}
    </DelegateStyle>
  );
}

function CDPList() {
  return (
    <NavRoute>
      {({ url }) => (
        <CDPListView currentPath={url.pathname} currentQuery={url.search} />
      )}
    </NavRoute>
  );
}

const NavbarItem = ({ href, label, ratio, active, ...props }) => (
  <NavbarItemContainer href={href} active={active} precache={true} {...props}>
    <Flex flexDirection="column" lineHeight="17px">
      <Text>{label}</Text>
      <RatioDisplay ratio={ratio} />
    </Flex>
  </NavbarItemContainer>
);

const Navbar = ({ ...props }) => (
  <StyledNavbar {...props}>
    <NavLink href="/" precache={true}>
      <StyledMakerLogo />
    </NavLink>
    <CDPList />
  </StyledNavbar>
);

export default Navbar;