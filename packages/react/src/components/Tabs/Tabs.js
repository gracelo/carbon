/**
 * Copyright IBM Corp. 2016, 2018
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { ChevronDown16, ChevronLeft16, ChevronRight16 } from '@carbon/icons-react';
import { settings } from 'carbon-components';
import { keys, match, matches } from '../../internal/keyboard';

const { prefix } = settings;

export default class Tabs extends React.Component {
  static propTypes = {
    /**
     * Specify the text to be read by screen-readers when visiting the <Tabs>
     * component
     */
    ariaLabel: PropTypes.string,

    /**
     * Pass in a collection of <Tab> children to be rendered depending on the
     * currently selected tab
     */
    children: PropTypes.node,

    /**
     * Provide a className that is applied to the root <nav> component for the
     * <Tabs>
     */
    className: PropTypes.string,

    /**
     * Specify whether the Tab content is hidden
     */
    hidden: PropTypes.bool,

    /**
     * By default, this value is "navigation". You can also provide an alternate
     * role if it makes sense from the accessibility-side
     */
    role: PropTypes.string.isRequired,

    /**
     * Provide the type of Tab
     */
    type: PropTypes.oneOf(['default', 'container']),

    /**
     * Optionally provide an `onClick` handler that is invoked when a <Tab> is
     * clicked
     */
    onClick: PropTypes.func,

    /**
     * Optionally provide an `onKeyDown` handler that is invoked when keyed
     * navigation is triggered
     */
    onKeyDown: PropTypes.func,

    /**
     * Provide an optional handler that is called whenever the selection
     * changes. This method is called with the index of the tab that was
     * selected
     */
    onSelectionChange: PropTypes.func,

    /**
     * Provide a string that represents the `href` for the triggered <Tab>
     */
    triggerHref: PropTypes.string.isRequired,

    /**
     * Optionally provide an index for the currently selected <Tab>
     */
    selected: PropTypes.number,

    /**
     * Provide a description that is read out when a user visits the caret icon
     * for the dropdown menu of items
     */
    iconDescription: PropTypes.string.isRequired,

    /**
     * Provide a className that is applied to the <TabContent> components
     */
    tabContentClassName: PropTypes.string,

    /**
     * Choose whether or not to automatically change selection on focus
     */
    selectionMode: PropTypes.oneOf(['automatic', 'manual']),
  };

  static defaultProps = {
    leftDescription: 'previous tabs',
    rightDescription: 'next tabs',
    role: 'navigation',
    type: 'default',
    triggerHref: '#',
    selected: 0,
    ariaLabel: 'listbox',
    selectionMode: 'automatic',
  };

  state = {
    arrowHidden: true,
    numTabsShown: 3, // TBD
    activePageNumber: 0,
    maxNumPages: 1,
  };

  static getDerivedStateFromProps({ selected }, state) {
    const { prevSelected } = state;
    return prevSelected === selected
      ? null
      : {
          selected,
          prevSelected: selected,
        };
  }

  componentDidMount() {
    const numOfTabs = this.getTabs().length;
    if (numOfTabs > 0) {
      const maxNumPages = Math.ceil(numOfTabs / this.state.numTabsShown);
      if (maxNumPages > 1) {
        let activePageNumber = 0;
        if (this.state.selected) {
          activePageNumber = Math.floor(this.state.selected / this.state.numTabsShown);
        }
        this.setState({
          maxNumPages,
          arrowHidden: false,
          activePageNumber,
        });
      }
    }
  }

  componentDidUpdate(_, prevState) {
    if (!this.state.arrowHidden) {
      if (this.state.selected !== prevState.selected) {
        const { selected, numTabsShown } = this.state;
        let activePageNumber = 0;
        if (selected) {
          activePageNumber = Math.floor(selected / numTabsShown);
        }
        this.setState({
          activePageNumber,
        });
      }
    }
  }

  getTabs() {
    return React.Children.map(this.props.children, tab => tab);
  }

  getEnabledTabs = () =>
    React.Children.toArray(this.props.children).reduce(
      (acc, tab, index) => (!tab.props.disabled ? acc.concat(index) : acc),
      []
    );

  getTabAt = (index, useFresh) => {
    return (
      (!useFresh && this[`tab${index}`]) ||
      React.Children.toArray(this.props.children)[index]
    );
  };

  setTabAt = (index, tabRef) => {
    this[`tab${index}`] = tabRef;
  };

  // following functions (handle*) are Props on Tab.js, see Tab.js for parameters
  handleTabClick = onSelectionChange => {
    return (index, evt) => {
      evt.preventDefault();

      this.selectTabAt(index, onSelectionChange);
      this.setState({
        dropdownHidden: true,
      });
    };
  };

  getDirection = evt => {
    if (match(evt, keys.ArrowLeft)) {
      return -1;
    }
    if (match(evt, keys.ArrowRight)) {
      return 1;
    }
    return 0;
  };

  getNextIndex = (index, direction) => {
    const enabledTabs = this.getEnabledTabs();
    const nextIndex = Math.max(
      enabledTabs.indexOf(index) + direction,
      -1 /* For `tab` not found in `enabledTabs` */
    );
    const nextIndexLooped =
      nextIndex >= 0 && nextIndex < enabledTabs.length
        ? nextIndex
        : nextIndex - Math.sign(nextIndex) * enabledTabs.length;
    return enabledTabs[nextIndexLooped];
  };

  handleTabKeyDown = onSelectionChange => {
    return (index, evt) => {
      if (matches(evt, [keys.Enter, keys.Space])) {
        this.selectTabAt(index, onSelectionChange);
        this.setState({
          dropdownHidden: true,
        });
      }

      if (window.matchMedia('(min-width: 42rem)').matches) {
        const nextIndex = this.getNextIndex(index, this.getDirection(evt));
        const tab = this.getTabAt(nextIndex);
        if (tab && matches(evt, [keys.ArrowLeft, keys.ArrowRight])) {
          evt.preventDefault();
          if (this.props.selectionMode !== 'manual') {
            this.selectTabAt(nextIndex, onSelectionChange);
          }
          if (tab.tabAnchor) {
            tab.tabAnchor.focus();
          }
        }
      }
    };
  };

  handleDropdownClick = () => {
    this.setState({
      dropdownHidden: !this.state.dropdownHidden,
    });
  };

  selectTabAt = (index, onSelectionChange) => {
    if (this.state.selected !== index) {
      this.setState({
        selected: index,
      });
      if (typeof onSelectionChange === 'function') {
        onSelectionChange(index);
      }
    }
  };

  handleLeftClick = () => {
    if (this.state.activePageNumber > 0) {
      this.setState({
        activePageNumber: this.state.activePageNumber - 1,
      });
    }
  };

  handleRightClick = () => {
    if (this.state.activePageNumber < this.state.maxNumPages) {
      this.setState({
        activePageNumber: this.state.activePageNumber + 1,
      });
    }
  };

  render() {
    const {
      ariaLabel,
      leftDescription,
      rightDescription,
      className,
      triggerHref,
      role,
      type,
      onSelectionChange,
      selectionMode, // eslint-disable-line no-unused-vars
      tabContentClassName,
      ...other
    } = this.props;

    /**
     * The tab panel acts like a tab panel when the screen is wider, but acts
     * like a select list when the screen is narrow.  In the wide case we want
     * to allow the user to use the tab key to set the focus in the tab panel
     * and then use the left and right arrow keys to navigate the tabs.  In the
     * narrow case we want to use the tab key to select different options in
     * the list.
     *
     * We set the tab index based on the different states so the browser will treat
     * the whole tab panel as a single focus component when it looks like a tab
     * panel and separate components when it looks like a select list.
     */
    const tabsWithProps = this.getTabs().map((tab, index) => {
      const tabPanelIndex = index === this.state.selected ? 0 : -1;
      const tabIndex = tabPanelIndex;
      let tabClass = '';
      if (!this.state.arrowHidden) {
        const pageNumber = Math.floor(index / this.state.numTabsShown);
        if (this.state.activePageNumber !== pageNumber) {
          tabClass = ' hidden';
        }
      }
      const newTab = React.cloneElement(tab, {
        index,
        className: `${tab.props.className}${tabClass}`,
        selected: index === this.state.selected,
        handleTabClick: this.handleTabClick(onSelectionChange),
        tabIndex,
        ref: e => {
          this.setTabAt(index, e);
        },
        handleTabKeyDown: this.handleTabKeyDown(onSelectionChange),
      });

      return newTab;
    });

    const tabContentWithProps = React.Children.map(tabsWithProps, tab => {
      const {
        id: tabId,
        children,
        selected,
        renderContent: TabContent,
      } = tab.props;

      return (
        <TabContent
          id={tabId && `${tabId}__panel`}
          className={tabContentClassName}
          aria-hidden={!selected}
          hidden={!selected}
          selected={selected}
          aria-labelledby={tabId}>
          {children}
        </TabContent>
      );
    });

    const classes = {
      tabs: classNames(`${prefix}--tabs`, className, {
        [`${prefix}--tabs--container`]: type === 'container',
      }),
      tablist: classNames(`${prefix}--tabs__nav`, {
        [`${prefix}--tabs__nav--hidden`]: this.state.dropdownHidden,
      }),
    };

    const selectedTab = this.getTabAt(this.state.selected, true);
    const selectedLabel = selectedTab ? selectedTab.props.label : '';
    const leftClick = this.handleLeftClick;
    const rightClick = this.handleRightClick;
    const leftArrowClass = (this.state.arrowHidden || this.state.activePageNumber === 0) ? ' hidden': '';
    const rightArrowClass = (this.state.arrowHidden || this.state.activePageNumber === this.state.maxNumPages - 1) ? ' hidden': '';

    return (
      <>
        <div {...other} className={classes.tabs} role={role}>
          <ul role="tablist" className={classes.tablist}>
            <li className="bx--tabs__nav-item" tabIndex="-1">
              <div
                role=""
                aria-label={ariaLabel}
                className={`${prefix}--tabs-left${leftArrowClass}`}
                onClick={leftClick}
                onKeyPress={leftClick}>
                <ChevronLeft16 aria-hidden="true">
                  {leftDescription && <title>{leftDescription}</title>}
                </ChevronLeft16>
              </div>
            </li>
            {tabsWithProps}
            <li className="bx--tabs__nav-item" tabIndex="-1">
              <div
                role=""
                aria-label={ariaLabel}
                className={`${prefix}--tabs-right${rightArrowClass}`}
                onClick={rightClick}
                onKeyPress={rightClick}>
                <ChevronRight16 aria-hidden="true">
                  {rightDescription && <title>{rightDescription}</title>}
                </ChevronRight16>
              </div>
            </li>
          </ul>
        </div>
        {tabContentWithProps}
      </>
    );
  }
}
