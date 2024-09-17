
// Contents of ./components/Avatar/index.tsx

import React from 'react';
import clsx from 'clsx';

export type AvatarSize = 'sm' | 'md' | 'lg';

export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  className?: string;
  src?: string;
  alt?: string;
  url?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  children?: React.ReactNode;
}

export const Avatar = (props: AvatarProps) => {
  const { className, src, alt, url, size = 'md', shape = 'circle', children } = props;

  const Element = url ? 'a' : 'span';
  return (
    <Element
      className={clsx('Avatar', `Avatar--${size}`, `Avatar--${shape}`, className)}
      href={url}
    >
      {src ? <img src={src} alt={alt} /> : children}
    </Element>
  );
};

// Contents of ./components/BackBottom/index.tsx

import React, { useEffect } from 'react';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { useLocale } from '../ConfigProvider';

interface BackBottomProps {
  count: number;
  onClick: () => void;
  onDidMount?: () => void;
}

export const BackBottom = ({ count, onClick, onDidMount }: BackBottomProps) => {
  const { trans } = useLocale('BackBottom');
  let text = trans('bottom');
  if (count) {
    text = trans(count === 1 ? 'newMsgOne' : 'newMsgOther').replace('{n}', count);
  }

  useEffect(() => {
    if (onDidMount) {
      onDidMount();
    }
  }, [onDidMount]);

  return (
    <div className="BackBottom">
      <Button className="slide-in-right-item" onClick={onClick}>
        {text}
        <Icon type="chevron-double-down" />
      </Button>
    </div>
  );
};

// Contents of ./components/Backdrop/index.tsx

import React from 'react';
import clsx from 'clsx';

export interface BackdropProps {
  className?: string;
  active?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const Backdrop = (props: BackdropProps) => {
  const { className, active, onClick, ...rest } = props;
  return (
    <div
      className={clsx('Backdrop', className, { active })}
      onClick={onClick}
      role="button"
      tabIndex={-1}
      aria-hidden
      {...rest}
    />
  );
};

// Contents of ./components/Bubble/index.tsx

import React from 'react';

export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: string;
  content?: React.ReactNode;
}

export const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>((props, ref) => {
  const { type = 'text', content, children, ...other } = props;
  return (
    <div className={`Bubble ${type}`} data-type={type} ref={ref} {...other}>
      {content && <p>{content}</p>}
      {children}
    </div>
  );
});

// Contents of ./components/Button/index.tsx

import React from 'react';
import clsx from 'clsx';
import { Icon } from '../Icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  label?: string;
  color?: 'primary';
  variant?: 'text' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

function composeClass(type?: string) {
  return type && `Btn--${type}`;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    className,
    label,
    color,
    variant,
    size: oSize,
    icon: oIcon,
    loading,
    block,
    disabled,
    children,
    onClick,
    ...other
  } = props;

  const icon = oIcon || (loading && 'spinner');
  const size = oSize || (block ? 'lg' : '');

  function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  }

  return (
    <button
      className={clsx(
        'Btn',
        composeClass(color),
        composeClass(variant),
        composeClass(size),
        {
          'Btn--block': block,
        },
        className,
      )}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      ref={ref}
      {...other}
    >
      {icon && (
        <span className="Btn-icon">
          <Icon type={icon} spin={loading} />
        </span>
      )}
      {label || children}
    </button>
  );
});

// Contents of ./components/Carousel/index.tsx

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import clsx from 'clsx';
import { CarouselItem } from './Item';
import { setTransform, setTransition } from '../../utils/style';
import canUse from '../../utils/canUse';

export interface CarouselProps {
  children: React.ReactNode;
  className?: string;
  startIndex?: number;
  draggable?: boolean;
  clickDragThreshold?: number;
  duration?: number;
  easing?: string;
  threshold?: number;
  loop?: boolean;
  rtl?: boolean;
  autoPlay?: boolean;
  interval?: number;
  // pauseOnHover?: boolean;
  dots?: boolean;
  onChange?: (activeIndex?: number) => void;

  // Deprecated:
  autoplay?: boolean;
  autoplaySpeed?: number;
  indicators?: boolean;
}

export interface CarouselHandle {
  goTo: (n: number) => void;
  prev: () => void;
  next: () => void;
}

interface State {
  first: boolean;
  wrapWidth: number;
  hover: boolean;
  startX: number;
  endX: number;
  startY: number;
  canMove: boolean | null;
  pressDown: boolean;
}

type DragEvent = React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement, MouseEvent>;

const formElements = ['TEXTAREA', 'OPTION', 'INPUT', 'SELECT'];
const canTouch = canUse('touch');

export const Carousel = React.forwardRef<CarouselHandle, CarouselProps>((props, ref) => {
  const {
    className,
    startIndex = 0,
    draggable = true,
    duration = 300,
    easing = 'ease',
    threshold = 20,
    clickDragThreshold = 10,
    loop = true,
    rtl = false,
    autoPlay = props.autoplay || false,
    interval = props.autoplaySpeed || 4000,
    dots = props.indicators || true,
    onChange,
    children,
  } = props;

  const count = React.Children.count(children);
  const itemWith = `${100 / count}%`;

  const wrapperRef = useRef<HTMLDivElement>(null!);
  const innerRef = useRef<HTMLDivElement>(null!);
  const autoPlayTimerRef = useRef<any>(null);

  const stateRef = useRef<State>({
    first: true,
    wrapWidth: 0,
    hover: false,
    startX: 0,
    endX: 0,
    startY: 0,
    canMove: null,
    pressDown: false,
  });

  const getIndex = useCallback(
    (idx: number) => (loop ? idx % count : Math.max(0, Math.min(idx, count - 1))),
    [count, loop],
  );

  const [activeIndex, setActiveIndex] = useState(getIndex(startIndex));
  const [isDragging, setDragging] = useState(false);

  const enableTransition = useCallback(() => {
    setTransition(innerRef.current, `transform ${duration}ms ${easing}`);
  }, [duration, easing]);

  const disableTransition = () => {
    setTransition(innerRef.current, 'transform 0s');
  };

  const moveX = (x: number) => {
    setTransform(innerRef.current, `translate3d(${x}px, 0, 0)`);
  };

  const slideTo = useCallback(
    (idx: number, smooth?: boolean) => {
      const nextIndex = loop ? idx + 1 : idx;
      const offset = (rtl ? 1 : -1) * nextIndex * stateRef.current.wrapWidth;

      if (smooth) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            enableTransition();
            moveX(offset);
          });
        });
      } else {
        moveX(offset);
      }
    },
    [enableTransition, loop, rtl],
  );

  const goTo = useCallback(
    (idx: number) => {
      if (count <= 1) {
        return;
      }

      const nextIndex = getIndex(idx);

      if (nextIndex !== activeIndex) {
        setActiveIndex(nextIndex);
        // slideTo(nextIndex, loop);
      }
    },
    [activeIndex, count, getIndex],
  );

  const prev = useCallback(() => {
    if (count <= 1) {
      return;
    }

    let nextIndex = activeIndex - 1;

    if (loop) {
      if (nextIndex < 0) {
        const state = stateRef.current;
        const moveTo = count + 1;
        const offset = (rtl ? 1 : -1) * moveTo * state.wrapWidth;
        const dragDist = draggable ? state.endX - state.startX : 0;

        disableTransition();
        moveX(offset + dragDist);
        nextIndex = count - 1;
      }
    } else {
      nextIndex = Math.max(nextIndex, 0);
    }

    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
      // slideTo(nextIndex, loop);
    }
  }, [activeIndex, count, draggable, loop, rtl]);

  const next = useCallback(() => {
    if (count <= 1) {
      return;
    }

    let nextIndex = activeIndex + 1;

    if (loop) {
      const isClone = nextIndex > count - 1;
      if (isClone) {
        nextIndex = 0;
        const state = stateRef.current;
        const dragDist = draggable ? state.endX - state.startX : 0;

        disableTransition();
        moveX(dragDist);
      }
    } else {
      nextIndex = Math.min(nextIndex, count - 1);
    }

    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
      // slideTo(nextIndex, loop);
    }
  }, [activeIndex, count, draggable, loop]);

  const doAutoPlay = useCallback(() => {
    if (!autoPlay || stateRef.current.hover) {
      return;
    }

    autoPlayTimerRef.current = setTimeout(() => {
      enableTransition();
      next();
    }, interval);
  }, [autoPlay, interval, enableTransition, next]);

  const clearAutoPlay = () => {
    clearTimeout(autoPlayTimerRef.current);
  };

  const resetToCurrent = () => {
    slideTo(activeIndex, true);
    doAutoPlay();
  };

  const updateAfterDrag = () => {
    const state = stateRef.current;
    const offset = (rtl ? -1 : 1) * (state.endX - state.startX);
    const offsetDist = Math.abs(offset);
    const isClone1 = offset > 0 && activeIndex - 1 < 0;
    const isClone2 = offset < 0 && activeIndex + 1 > count - 1;

    if (isClone1 || isClone2) {
      if (loop) {
        if (isClone1) {
          prev();
        } else {
          next();
        }
      } else {
        resetToCurrent();
      }
    } else if (offset > 0 && offsetDist > threshold && count > 1) {
      prev();
    } else if (offset < 0 && offsetDist > threshold && count > 1) {
      next();
    } else {
      resetToCurrent();
    }
  };

  const resetDrag = () => {
    const state = stateRef.current;

    state.startX = 0;
    state.endX = 0;
    state.startY = 0;
    state.canMove = null;
    state.pressDown = false;
  };

  const dragStart = (e: DragEvent) => {
    if (formElements.includes((e.target as Element).nodeName)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const ev = 'touches' in e ? e.touches[0] : e;
    const state = stateRef.current;

    state.pressDown = true;
    state.startX = ev.pageX;
    state.startY = ev.pageY;

    clearAutoPlay();
  };

  const dragMove = (e: DragEvent) => {
    e.stopPropagation();

    const ev = 'touches' in e ? e.touches[0] : e;
    const state = stateRef.current;

    if (state.pressDown) {
      if ('touches' in e) {
        if (state.canMove === null) {
          state.canMove = Math.abs(state.startY - ev.pageY) < Math.abs(state.startX - ev.pageX);
        }
        if (!state.canMove) {
          return;
        }
      }

      e.preventDefault();
      disableTransition();

      state.endX = ev.pageX;

      const nextIndex = loop ? activeIndex + 1 : activeIndex;
      const nextOffset = nextIndex * state.wrapWidth;
      const dragOffset = state.endX - state.startX;

      if (!isDragging && Math.abs(dragOffset) > clickDragThreshold) {
        setDragging(true);
      }

      // 阻尼
      // if ((activeIndex === 0 && dragOffset > 0) || (activeIndex === count - 1 && dragOffset < 0)) {
      //   dragOffset *= 0.35;
      // }

      const offset = rtl ? nextOffset + dragOffset : dragOffset - nextOffset;
      moveX(offset);
    }
  };

  const dragEnd = (e: DragEvent) => {
    e.stopPropagation();
    const state = stateRef.current;
    state.pressDown = false;
    setDragging(false);
    enableTransition();
    if (state.endX) {
      updateAfterDrag();
    } else {
      // when clicked
      doAutoPlay();
    }
    resetDrag();
  };

  const onMouseEnter = () => {
    stateRef.current.hover = true;
    clearAutoPlay();
  };

  const onMouseLeave = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const state = stateRef.current;
    state.hover = false;

    if (state.pressDown) {
      state.pressDown = false;
      state.endX = e.pageX;

      enableTransition();
      updateAfterDrag();
      resetDrag();
    }

    doAutoPlay();
  };

  const handleClickDot = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const { slideTo: i } = e.currentTarget.dataset;
    if (i) {
      const idx = parseInt(i, 10);
      goTo(idx);
    }
    e.preventDefault();
  };

  useImperativeHandle(
    ref,
    () => ({
      goTo,
      prev,
      next,
      wrapperRef,
    }),
    [goTo, prev, next],
  );

  useEffect(() => {
    // should use ResizeObserver
    function handleResize() {
      stateRef.current.wrapWidth = wrapperRef.current.offsetWidth;
      slideTo(activeIndex);
    }

    if (stateRef.current.first) {
      handleResize();
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeIndex, slideTo]);

  useEffect(() => {
    if (onChange && !stateRef.current.first) {
      onChange(activeIndex);
    }
  }, [activeIndex, onChange]);

  useEffect(() => {
    if (stateRef.current.first) {
      slideTo(activeIndex);
      stateRef.current.first = false;
    } else {
      slideTo(activeIndex, true);
    }
  }, [activeIndex, slideTo]);

  useEffect(() => {
    doAutoPlay();

    return () => {
      clearAutoPlay();
    };
  }, [autoPlay, activeIndex, doAutoPlay]);

  let events;

  if (draggable) {
    events = canTouch
      ? {
          onTouchStart: dragStart,
          onTouchMove: dragMove,
          onTouchEnd: dragEnd,
        }
      : {
          onMouseDown: dragStart,
          onMouseMove: dragMove,
          onMouseUp: dragEnd,
          onMouseEnter,
          onMouseLeave,
        };
  } else {
    events = {
      onMouseEnter,
      onMouseLeave,
    };
  }

  return (
    <div
      className={clsx(
        'Carousel',
        {
          'Carousel--draggable': draggable,
          'Carousel--rtl': rtl,
          'Carousel--dragging': isDragging,
        },
        className,
      )}
      ref={wrapperRef}
      {...events}
    >
      <div
        className="Carousel-inner"
        style={{ width: `${loop ? count + 2 : count}00%` }}
        ref={innerRef}
      >
        {loop && (
          <CarouselItem width={itemWith}>
            {React.Children.toArray(children)[count - 1]}
          </CarouselItem>
        )}
        {React.Children.map(children, (item, i) => (
          <CarouselItem width={itemWith} key={i}>
            {item}
          </CarouselItem>
        ))}
        {loop && (
          <CarouselItem width={itemWith}>{React.Children.toArray(children)[0]}</CarouselItem>
        )}
      </div>
      {dots && (
        <ol className="Carousel-dots">
          {React.Children.map(children, (_, i) => (
            <li key={i}>
              <button
                className={clsx('Carousel-dot', { active: activeIndex === i })}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                data-slide-to={i}
                onClick={handleClickDot}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
});

// Contents of ./components/Chat/index.tsx

import React, { useEffect } from 'react';
import { ConfigProvider, ConfigContextType } from '../ConfigProvider';
import { Navbar, NavbarProps } from '../Navbar';
import {
  MessageContainer,
  MessageContainerProps,
  MessageContainerHandle,
} from '../MessageContainer';
import { QuickReplies, QuickReplyItemProps } from '../QuickReplies';
import { Composer as DComposer, ComposerProps, ComposerHandle } from '../Composer';
import { isSafari, getIOSMajorVersion } from '../../utils/ua';

export type ChatProps = Omit<ComposerProps, 'onFocus' | 'onChange' | 'onBlur'> &
  ConfigContextType &
  MessageContainerProps & {
    /**
     * 宽版模式断点
     */
    // wideBreakpoint?: string;
    /**
     * 导航栏配置
     */
    navbar?: NavbarProps;
    /**
     * 导航栏渲染函数
     */
    renderNavbar?: () => React.ReactNode;
    /**
     * 加载更多文案
     */
    // loadMoreText?: string;
    /**
     * 在消息列表上面的渲染函数
     */
    // renderBeforeMessageList?: () => React.ReactNode;
    /**
     * 消息列表 ref
     */
    messagesRef?: React.RefObject<MessageContainerHandle>;
    /**
     * 下拉加载回调
     */
    // onRefresh?: () => Promise<any>;
    /**
     * 滚动消息列表回调
     */
    // onScroll?: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
    /**
     * 消息列表
     */
    // messages: MessageProps[];
    /**
     * 消息内容渲染函数
     */
    // renderMessageContent: (message: MessageProps) => React.ReactNode;
    /**
     * 快捷短语
     */
    quickReplies?: QuickReplyItemProps[];
    /**
     * 快捷短语是否可见
     */
    quickRepliesVisible?: boolean;
    /**
     * 快捷短语的点击回调
     */
    onQuickReplyClick?: (item: QuickReplyItemProps, index: number) => void;
    /**
     * 快捷短语的滚动回调
     */
    onQuickReplyScroll?: () => void;
    /**
     * 快捷短语渲染函数
     */
    renderQuickReplies?: () => void;
    /**
     * 输入区 ref
     */
    composerRef?: React.RefObject<ComposerHandle>;
    /**
     * 输入框初始内容
     */
    // text?: string;
    /**
     * 输入框占位符
     */
    // placeholder?: string;
    /**
     * 输入框聚焦回调
     */
    onInputFocus?: ComposerProps['onFocus'];
    /**
     * 输入框更新回调
     */
    onInputChange?: ComposerProps['onChange'];
    /**
     * 输入框失去焦点回调
     */
    onInputBlur?: ComposerProps['onBlur'];
    /**
     * 发送消息回调
     */
    // onSend: (type: string, content: string) => void;
    /**
     * 发送图片回调
     */
    // onImageSend?: (file: File) => Promise<any>;
    /**
     * 输入方式
     */
    // inputType?: InputType;
    /**
     * 输入方式切换回调
     */
    // onInputTypeChange?: () => void;
    /**
     * 语音输入
     */
    // recorder?: RecorderProps;
    /**
     * 工具栏
     */
    // toolbar?: ToolbarItemProps[];
    /**
     * 点击工具栏回调
     */
    // onToolbarClick?: () => void;
    /**
     * 点击附加内容回调
     */
    // onAccessoryToggle?: () => void;
    /**
     * 输入组件
     */
    Composer?: React.ElementType; // FIXME
  };

export const Chat = React.forwardRef<HTMLDivElement, ChatProps>((props, ref) => {
  const {
    wideBreakpoint,
    locale = 'zh-CN',
    locales,
    elderMode,
    navbar,
    renderNavbar,
    loadMoreText,
    renderBeforeMessageList,
    messagesRef,
    onRefresh,
    onScroll,
    messages = [],
    isTyping,
    renderMessageContent,
    onBackBottomShow,
    onBackBottomClick,
    quickReplies = [],
    quickRepliesVisible,
    onQuickReplyClick = () => {},
    onQuickReplyScroll,
    renderQuickReplies,
    text,
    textOnce,
    placeholder,
    onInputFocus,
    onInputChange,
    onInputBlur,
    onSend,
    onImageSend,
    inputOptions,
    composerRef,
    inputType,
    onInputTypeChange,
    recorder,
    toolbar,
    onToolbarClick,
    onAccessoryToggle,
    rightAction,
    Composer = DComposer,
  } = props;

  function handleInputFocus(e: React.FocusEvent<HTMLTextAreaElement>) {
    if (messagesRef && messagesRef.current) {
      messagesRef.current.scrollToEnd({ animated: false, force: true });
    }
    if (onInputFocus) {
      onInputFocus(e);
    }
  }

  useEffect(() => {
    const rootEl = document.documentElement;
    if (isSafari()) {
      rootEl.dataset.safari = '';
    }

    const v = getIOSMajorVersion();
    // iOS 9、10 不支持按钮使用 flex
    if (v && v < 11) {
      rootEl.dataset.oldIos = '';
    }
  }, []);

  return (
    <ConfigProvider locale={locale} locales={locales} elderMode={elderMode}>
      <div className="ChatApp" data-elder-mode={elderMode} ref={ref}>
        {renderNavbar ? renderNavbar() : navbar && <Navbar {...navbar} />}
        <MessageContainer
          ref={messagesRef}
          loadMoreText={loadMoreText}
          messages={messages}
          isTyping={isTyping}
          renderBeforeMessageList={renderBeforeMessageList}
          renderMessageContent={renderMessageContent}
          onRefresh={onRefresh}
          onScroll={onScroll}
          onBackBottomShow={onBackBottomShow}
          onBackBottomClick={onBackBottomClick}
        />
        <div className="ChatFooter">
          {renderQuickReplies ? (
            renderQuickReplies()
          ) : (
            <QuickReplies
              items={quickReplies}
              visible={quickRepliesVisible}
              onClick={onQuickReplyClick}
              onScroll={onQuickReplyScroll}
            />
          )}
          <Composer
            wideBreakpoint={wideBreakpoint}
            ref={composerRef}
            inputType={inputType}
            text={text}
            textOnce={textOnce}
            inputOptions={inputOptions}
            placeholder={placeholder}
            onAccessoryToggle={onAccessoryToggle}
            recorder={recorder}
            toolbar={toolbar}
            onToolbarClick={onToolbarClick}
            onInputTypeChange={onInputTypeChange}
            onFocus={handleInputFocus}
            onChange={onInputChange}
            onBlur={onInputBlur}
            onSend={onSend}
            onImageSend={onImageSend}
            rightAction={rightAction}
          />
        </div>
      </div>
    </ConfigProvider>
  );
});

// Contents of ./components/ClickOutside/index.tsx

import React, { useEffect, useRef } from 'react';

const doc = document;
const html = doc.documentElement;

export interface ClickOutsideProps {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  // mouseEvent?: 'click' | 'mousedown' | 'mouseup' | false;
  mouseEvent?: 'click' | 'mousedown' | 'mouseup';
  children?: React.ReactNode;
}

export const ClickOutside = (props: ClickOutsideProps) => {
  const { children, onClick, mouseEvent = 'mouseup', ...others } = props;
  const wrapper = useRef<HTMLDivElement>(null!);

  function handleClick(e: any) {
    if (!wrapper.current) return;

    if (html.contains(e.target) && !wrapper.current.contains(e.target)) {
      onClick(e);
    }
  }

  useEffect(() => {
    if (mouseEvent) {
      doc.addEventListener(mouseEvent, handleClick);
    }
    return () => {
      doc.removeEventListener(mouseEvent, handleClick);
    };
  });

  return (
    <div ref={wrapper} {...others}>
      {children}
    </div>
  );
};

// Contents of ./components/ComponentsProvider/index.tsx

import React, { useEffect } from 'react';
import { lazyComponent } from '../../utils/lazyComponent';
import { LazyComponentWithCode } from '../LazyComponent';
import { ComponentsContext } from './ComponentsContext';
import {
  ComponentInterface,
  GetComponentCallback,
  ComponentsProviderProps,
  ComponentsMap,
} from './interface';

export { useComponents } from './useComponents';
export type { ComponentsProviderProps, ComponentsMap };

export const ComponentsProvider = (props: ComponentsProviderProps) => {
  const { components, children } = props;
  const componentsRef = React.useRef<ComponentsMap>({ ...components });

  useEffect(() => {
    componentsRef.current = {
      ...components,
      ...componentsRef.current,
    };
  }, [components]);

  function addComponent(code: string, val: ComponentInterface) {
    componentsRef.current[code] = val;
  }

  function hasComponent(code: string) {
    return componentsRef.current.hasOwnProperty(code);
  }

  function getComponent(code: string, callback: GetComponentCallback = () => {}) {
    const comp = componentsRef.current[code];

    // no component
    if (!comp) {
      callback({ code, errCode: 'NO_CODE' });
      return null;
    }

    if ('component' in comp) {
      if (comp.type !== 'decorator') {
        callback({ code, async: false, component: comp.component });
      }
      return comp.component;
    }

    if ('decorator' in comp) {
      const component = (compProps: any) => (
        <LazyComponentWithCode
          code={comp.decorator}
          decoratorData={comp.data}
          onLoad={callback}
          {...compProps}
        />
      );

      componentsRef.current[code] = { component, type: 'decorator' };
      return component;
    }

    if ('url' in comp) {
      const component = lazyComponent(
        comp.url,
        comp.name,
        () => {
          componentsRef.current[code] = { component };
          callback({ code, async: true, component });
        },
        () => {
          callback({ code, errCode: 'ERR_IMPORT_SCRIPT' });
        },
      );

      return component;
    }

    callback({ code, errCode: 'NO_HANDLER' });
    return null;
  }

  return (
    <ComponentsContext.Provider value={{ addComponent, hasComponent, getComponent }}>
      {children}
    </ComponentsContext.Provider>
  );
};

// Contents of ./components/Composer/index.tsx

import React, { useState, useRef, useEffect, useImperativeHandle, useCallback } from 'react';
import clsx from 'clsx';
import { IconButtonProps } from '../IconButton';
import { Recorder, RecorderProps } from '../Recorder';
import { Toolbar, ToolbarItemProps } from '../Toolbar';
import { AccessoryWrap } from './AccessoryWrap';
import { Popover } from '../Popover';
import { InputProps } from '../Input';
import { ToolbarItem } from './ToolbarItem';
import { ComposerInput } from './ComposerInput';
import { SendButton } from './SendButton';
import { Action } from './Action';
import toggleClass from '../../utils/toggleClass';

export const CLASS_NAME_FOCUSING = 'S--focusing';

export type InputType = 'voice' | 'text';

export type ComposerProps = {
  wideBreakpoint?: string;
  text?: string;
  textOnce?: string;
  inputOptions?: InputProps;
  placeholder?: string;
  inputType?: InputType;
  onInputTypeChange?: (inputType: InputType) => void;
  recorder?: RecorderProps;
  onSend: (type: string, content: string) => void;
  onImageSend?: (file: File) => Promise<any>;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onChange?: (value: string, event: React.ChangeEvent<Element>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  toolbar?: ToolbarItemProps[];
  onToolbarClick?: (item: ToolbarItemProps, event: React.MouseEvent) => void;
  onAccessoryToggle?: (isAccessoryOpen: boolean) => void;
  rightAction?: IconButtonProps;
};

export interface ComposerHandle {
  setText: (text: string) => void;
}

export const Composer = React.forwardRef<ComposerHandle, ComposerProps>((props, ref) => {
  const {
    text: initialText = '',
    textOnce: oTextOnce,
    inputType: initialInputType = 'text',
    wideBreakpoint,
    placeholder: oPlaceholder = 'Please enter...',
    recorder = {},
    onInputTypeChange,
    onFocus,
    onBlur,
    onChange,
    onSend,
    onImageSend,
    onAccessoryToggle,
    toolbar = [],
    onToolbarClick,
    rightAction,
    inputOptions,
  } = props;

  const [text, setText] = useState(initialText);
  const [textOnce, setTextOnce] = useState('');
  const [placeholder, setPlaceholder] = useState(oPlaceholder);
  const [inputType, setInputType] = useState(initialInputType || 'text');
  const [isAccessoryOpen, setAccessoryOpen] = useState(false);
  const [accessoryContent, setAccessoryContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null!);
  const focused = useRef(false);
  const blurTimer = useRef<any>();
  const popoverTarget = useRef<any>();
  const isMountRef = useRef(false);
  const [isWide, setWide] = useState(false);

  useEffect(() => {
    const mq =
      wideBreakpoint && window.matchMedia
        ? window.matchMedia(`(min-width: ${wideBreakpoint})`)
        : false;

    function handleMq(e: MediaQueryListEvent) {
      setWide(e.matches);
    }

    setWide(mq && mq.matches);

    if (mq) {
      mq.addListener(handleMq);
    }
    return () => {
      if (mq) {
        mq.removeListener(handleMq);
      }
    };
  }, [wideBreakpoint]);

  useEffect(() => {
    toggleClass('S--wide', isWide);
    if (!isWide) {
      setAccessoryContent('');
    }
  }, [isWide]);

  useEffect(() => {
    if (isMountRef.current && onAccessoryToggle) {
      onAccessoryToggle(isAccessoryOpen);
    }
  }, [isAccessoryOpen, onAccessoryToggle]);

  useEffect(() => {
    if (oTextOnce) {
      setTextOnce(oTextOnce);
      setPlaceholder(oTextOnce);
    } else {
      setTextOnce('');
      setPlaceholder(oPlaceholder);
    }
  }, [oPlaceholder, oTextOnce]);

  useEffect(() => {
    isMountRef.current = true;
  }, []);

  useImperativeHandle(ref, () => ({
    setText,
  }));

  const handleInputTypeChange = useCallback(() => {
    const isVoice = inputType === 'voice';
    const nextType = isVoice ? 'text' : 'voice';
    setInputType(nextType);

    if (isVoice) {
      const input = inputRef.current;
      input.focus();
      // eslint-disable-next-line no-multi-assign
      input.selectionStart = input.selectionEnd = input.value.length;
    }
    if (onInputTypeChange) {
      onInputTypeChange(nextType);
    }
  }, [inputType, onInputTypeChange]);

  const handleInputFocus = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      clearTimeout(blurTimer.current);
      toggleClass(CLASS_NAME_FOCUSING, true);
      focused.current = true;

      if (onFocus) {
        onFocus(e);
      }
    },
    [onFocus],
  );

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      blurTimer.current = setTimeout(() => {
        toggleClass(CLASS_NAME_FOCUSING, false);
        focused.current = false;
      }, 0);

      if (onBlur) {
        onBlur(e);
      }
    },
    [onBlur],
  );

  const send = useCallback(() => {
    if (text) {
      onSend('text', text);
      setText('');
    } else if (textOnce) {
      onSend('text', textOnce);
    }
    if (textOnce) {
      setTextOnce('');
      setPlaceholder(oPlaceholder);
    }
    if (focused.current) {
      inputRef.current.focus();
    }
  }, [oPlaceholder, onSend, text, textOnce]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!e.shiftKey && e.keyCode === 13) {
        send();
        e.preventDefault();
      }
    },
    [send],
  );

  const handleTextChange = useCallback(
    (value: string, e: React.ChangeEvent) => {
      setText(value);

      if (onChange) {
        onChange(value, e);
      }
    },
    [onChange],
  );

  const handleSendBtnClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      send();
      e.preventDefault();
    },
    [send],
  );

  const handleAccessoryToggle = useCallback(() => {
    setAccessoryOpen(!isAccessoryOpen);
  }, [isAccessoryOpen]);

  const handleAccessoryBlur = useCallback(() => {
    setTimeout(() => {
      setAccessoryOpen(false);
      setAccessoryContent('');
    });
  }, []);

  const handleToolbarClick = useCallback(
    (item: ToolbarItemProps, e: React.MouseEvent) => {
      if (onToolbarClick) {
        onToolbarClick(item, e);
      }
      if (item.render) {
        popoverTarget.current = e.currentTarget;
        setAccessoryContent(item.render);
      }
    },
    [onToolbarClick],
  );

  const handlePopoverClose = useCallback(() => {
    setAccessoryContent('');
  }, []);

  const isInputText = inputType === 'text';
  const inputTypeIcon = isInputText ? 'volume-circle' : 'keyboard-circle';
  const hasToolbar = toolbar.length > 0;

  const inputProps = {
    ...inputOptions,
    value: text,
    inputRef,
    placeholder,
    onFocus: handleInputFocus,
    onBlur: handleInputBlur,
    onKeyDown: handleInputKeyDown,
    onChange: handleTextChange,
    onImageSend,
  };

  if (isWide) {
    return (
      <div className="Composer Composer--lg">
        {hasToolbar &&
          toolbar.map((item) => (
            <ToolbarItem item={item} onClick={(e) => handleToolbarClick(item, e)} key={item.type} />
          ))}
        {accessoryContent && (
          <Popover
            active={!!accessoryContent}
            target={popoverTarget.current}
            onClose={handlePopoverClose}
          >
            {accessoryContent}
          </Popover>
        )}
        <div className="Composer-inputWrap">
          <ComposerInput invisible={false} {...inputProps} />
        </div>
        <SendButton onClick={handleSendBtnClick} disabled={!text} />
      </div>
    );
  }

  return (
    <>
      <div className="Composer">
        {recorder.canRecord && (
          <Action
            className="Composer-inputTypeBtn"
            data-icon={inputTypeIcon}
            icon={inputTypeIcon}
            onClick={handleInputTypeChange}
            aria-label={isInputText ? '切换到语音输入' : '切换到键盘输入'}
          />
        )}
        <div className="Composer-inputWrap">
          <ComposerInput invisible={!isInputText} {...inputProps} />
          {!isInputText && <Recorder {...recorder} />}
        </div>
        {!text && rightAction && <Action {...rightAction} />}
        {hasToolbar && (
          <Action
            className={clsx('Composer-toggleBtn', {
              active: isAccessoryOpen,
            })}
            icon="plus-circle"
            onClick={handleAccessoryToggle}
            aria-label={isAccessoryOpen ? '关闭工具栏' : '展开工具栏'}
          />
        )}
        {(text || textOnce) && <SendButton onClick={handleSendBtnClick} disabled={false} />}
      </div>
      {isAccessoryOpen && (
        <AccessoryWrap onClickOutside={handleAccessoryBlur}>
          {accessoryContent || <Toolbar items={toolbar} onClick={handleToolbarClick} />}
        </AccessoryWrap>
      )}
    </>
  );
});

// Contents of ./components/ConfigProvider/index.tsx

import React, { useContext } from 'react';
import defaultLocales from './locales';

type ILocales = {
  [k: string]: any;
};

export type ConfigContextType = {
  /**
   * 当前语言
   */
  locale?: string;
  /**
   * 多语言
   */
  locales?: ILocales;
  /**
   * 适老化模式
   */
  elderMode?: boolean;
};

export type ConfigProviderProps = ConfigContextType & {
  children: React.ReactNode;
};

const DEFAULT_LOCALE = 'en-US';

export const ConfigContext = React.createContext<ConfigContextType>({});

export const ConfigProvider = ({
  locale = DEFAULT_LOCALE,
  locales,
  elderMode,
  children,
}: ConfigProviderProps) => (
  <ConfigContext.Provider value={{ locale, locales, elderMode }}>{children}</ConfigContext.Provider>
);

export const useConfig = () => useContext(ConfigContext);

export const useLocale = (componentName?: string, fallback?: ILocales) => {
  const { locale, locales } = useContext(ConfigContext);
  const defaultStrings = (locale && defaultLocales[locale]) || defaultLocales[DEFAULT_LOCALE];
  let strings = { ...defaultStrings, ...locales };

  if (!locale && !locales && fallback) {
    strings = fallback;
  } else if (componentName) {
    strings = strings[componentName] || {};
  }

  return {
    locale,
    trans: (key?: string) => (key ? strings[key] : strings),
  };
};

// Contents of ./components/Divider/index.tsx

import React from 'react';
import clsx from 'clsx';

export interface DividerProps {
  className?: string;
  position?: 'center' | 'left' | 'right';
  children?: React.ReactNode;
}

export const Divider = (props: DividerProps) => {
  const { className, position = 'center', children, ...other } = props;
  return (
    <div
      className={clsx('Divider', !!children && `Divider--text-${position}`, className)}
      role="separator"
      {...other}
    >
      {children}
    </div>
  );
};

// Contents of ./components/Empty/index.tsx

import React from 'react';
import clsx from 'clsx';
import { Flex } from '../Flex';

export interface EmptyProps {
  className?: string;
  type?: 'error' | 'default';
  image?: string;
  tip?: string;
  children?: React.ReactNode;
}

const IMAGE_EMPTY = '//gw.alicdn.com/tfs/TB1fnnLRkvoK1RjSZFDXXXY3pXa-300-250.svg';
const IMAGE_OOPS = '//gw.alicdn.com/tfs/TB1lRjJRbvpK1RjSZPiXXbmwXXa-300-250.svg';

export const Empty = React.forwardRef<HTMLDivElement, EmptyProps>((props, ref) => {
  const { className, type, image, tip, children } = props;
  const imgUrl = image || (type === 'error' ? IMAGE_OOPS : IMAGE_EMPTY);

  return (
    <Flex className={clsx('Empty', className)} direction="column" center ref={ref}>
      <img className="Empty-img" src={imgUrl} alt={tip} />
      {tip && <p className="Empty-tip">{tip}</p>}
      {children}
    </Flex>
  );
});

// Contents of ./components/ErrorBoundary/index.tsx

import React from 'react';

export interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export interface FallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo;
  [k: string]: any;
}

export type ErrorBoundaryProps = {
  FallbackComponent?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  [k: string]: any;
};

export class ErrorBoundary extends React.Component<
  React.PropsWithRef<React.PropsWithChildren<ErrorBoundaryProps>>,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError } = this.props;
    if (onError) {
      onError(error, errorInfo);
    }
    this.setState({ error, errorInfo });
  }

  render() {
    const { FallbackComponent, children, ...rest } = this.props;
    const { error, errorInfo } = this.state;

    if (errorInfo) {
      if (FallbackComponent) {
        return <FallbackComponent error={error!} errorInfo={errorInfo} {...rest} />;
      }

      return null;
    }

    return children;
  }
}

// Contents of ./components/FileCard/index.tsx

import React from 'react';
import clsx from 'clsx';
import { Card } from '../Card';
import { Flex, FlexItem } from '../Flex';
import { Icon } from '../Icon';
import { Text } from '../Text';
import getExtName from '../../utils/getExtName';
import prettyBytes from '../../utils/prettyBytes';

export interface FileCardProps {
  className?: string;
  file: File;
  extension?: string;
  children?: React.ReactNode;
}

export const FileCard = React.forwardRef<HTMLDivElement, FileCardProps>((props, ref) => {
  const { className, file, extension, children } = props;
  const { name, size } = file;
  const ext = extension || getExtName(name);

  return (
    <Card className={clsx('FileCard', className)} size="xl" ref={ref}>
      <Flex>
        <div className="FileCard-icon" data-type={ext}>
          <Icon type="file" />
          <Text truncate as="span" className="FileCard-ext">
            {ext}
          </Text>
        </div>
        <FlexItem>
          <Text truncate={2} breakWord className="FileCard-name">
            {name}
          </Text>
          <div className="FileCard-meta">
            {size != null && <span className="FileCard-size">{prettyBytes(size)}</span>}
            {children}
          </div>
        </FlexItem>
      </Flex>
    </Card>
  );
});

// Contents of ./components/Goods/index.tsx

import React from 'react';
import clsx from 'clsx';
import { Flex, FlexItem } from '../Flex';
import { Text } from '../Text';
import { Price } from '../Price';
import { Tag } from '../Tag';
import { IconButton, IconButtonProps } from '../IconButton';
import { Button, ButtonProps } from '../Button';
import { useConfig } from '../ConfigProvider';

type TagProps = {
  name: string;
};

export type GoodsRef = HTMLDivElement;

export interface GoodsProps extends React.HTMLAttributes<GoodsRef> {
  className?: string;
  type?: 'goods' | 'order';
  img?: string;
  name: string;
  desc?: React.ReactNode;
  tags?: TagProps[];
  locale?: string;
  currency?: string;
  price?: number;
  originalPrice?: number;
  meta?: React.ReactNode;
  count?: number;
  unit?: string;
  status?: string;
  action?: ButtonProps | IconButtonProps;
  elderMode?: boolean;
  children?: React.ReactNode;
}

export const Goods = React.forwardRef<GoodsRef, GoodsProps>((props, ref) => {
  const configCtx = useConfig();

  const {
    // 通用
    className,
    type,
    img,
    name,
    desc,
    tags = [],
    locale,
    currency,
    price,
    count,
    unit,
    action,
    elderMode: oElderMode,
    children,

    // 商品
    originalPrice,
    meta,

    // 订单
    status,
    ...other
  } = props;

  const elderMode = oElderMode || configCtx.elderMode;
  const isOrder = type === 'order' && !elderMode;
  const isGoods = type !== 'order' && !elderMode;

  const priceProps = { currency, locale };
  const priceCont = price != null && <Price price={price} {...priceProps} />;

  const countUnit = (
    <div className="Goods-countUnit">
      {count && (
        <span className="Goods-count">
          &times;
          {count}
        </span>
      )}
      {unit && <span className="Goods-unit">{unit}</span>}
    </div>
  );

  return (
    <Flex
      className={clsx('Goods', className)}
      data-type={type}
      data-elder-mode={elderMode}
      ref={ref}
      {...other}
    >
      {img && <img className="Goods-img" src={img} alt={name} />}
      <FlexItem className="Goods-main">
        {isGoods && action && <IconButton className="Goods-buyBtn" icon="cart" {...action} />}
        <Text as="h4" truncate={isOrder ? 2 : true} className="Goods-name">
          {name}
        </Text>
        <Text className="Goods-desc" truncate={elderMode}>
          {desc}
        </Text>
        {elderMode ? (
          <Flex alignItems="center" justifyContent="space-between">
            {priceCont}
            {action && <Button size="sm" {...action} />}
          </Flex>
        ) : (
          <div className="Goods-tags">
            {tags.map((t) => (
              <Tag color="primary" key={t.name}>
                {t.name}
              </Tag>
            ))}
          </div>
        )}
        {isGoods && (
          <Flex alignItems="flex-end">
            <FlexItem>
              {priceCont}
              {originalPrice && <Price price={originalPrice} original {...priceProps} />}
              {meta && <span className="Goods-meta">{meta}</span>}
            </FlexItem>
            {countUnit}
          </Flex>
        )}
        {children}
      </FlexItem>
      {isOrder && (
        <div className="Goods-aside">
          {priceCont}
          {countUnit}
          <span className="Goods-status">{status}</span>
          {action && <Button className="Goods-detailBtn" {...action} />}
        </div>
      )}
    </Flex>
  );
});

// Contents of ./components/HelpText/index.tsx

import React from 'react';

export interface HelpTextProps extends React.HTMLAttributes<HTMLDivElement> {}

export const HelpText = (props: HelpTextProps) => {
  const { children, ...others } = props;
  return (
    <div className="HelpText" {...others}>
      {children}
    </div>
  );
};

// Contents of ./components/Icon/index.tsx

import React from 'react';
import clsx from 'clsx';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  type: string;
  className?: string;
  name?: string;
  spin?: boolean;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  const { type, className, spin, name, ...other } = props;
  const ariaProps = typeof name === 'string' ? { 'aria-label': name } : { 'aria-hidden': true };

  return (
    <svg
      className={clsx('Icon', { 'is-spin': spin }, className)}
      ref={ref}
      {...ariaProps}
      {...other}
    >
      <use xlinkHref={`#icon-${type}`} />
    </svg>
  );
});

// Contents of ./components/IconButton/index.tsx

import React from 'react';
import clsx from 'clsx';
import { Button, ButtonProps } from '../Button';
import { Icon } from '../Icon';

export interface IconButtonProps extends ButtonProps {
  img?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const { className, icon, img, ...other } = props;
  return (
    <Button className={clsx('IconBtn', className)} ref={ref} {...other}>
      {icon && <Icon type={icon} />}
      {!icon && img && <img src={img} alt="" />}
    </Button>
  );
});

// Contents of ./components/Image/index.tsx

import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import useForwardRef from '../../hooks/useForwardRef';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  src: string;
  lazy?: boolean;
  fluid?: boolean;
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  const { className, src: oSrc, lazy, fluid, children, ...other } = props;
  const [src, setSrc] = useState(lazy ? undefined : oSrc);
  const imgRef = useForwardRef(ref);
  const savedSrc = useRef('');
  const lazyLoaded = useRef(false);

  useEffect(() => {
    if (!lazy) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSrc(savedSrc.current);
        lazyLoaded.current = true;
        observer.unobserve(entry.target);
      }
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [imgRef, lazy]);

  useEffect(() => {
    savedSrc.current = oSrc;
    if (!lazy || lazyLoaded.current) {
      setSrc(oSrc);
    }
  }, [lazy, oSrc]);

  return (
    <img
      className={clsx('Image', { 'Image--fluid': fluid }, className)}
      src={src}
      alt=""
      ref={imgRef}
      {...other}
    />
  );
});

// Contents of ./components/InfiniteScroll/index.tsx

import React from 'react';
import clsx from 'clsx';
import useForwardRef from '../../hooks/useForwardRef';
import getToBottom from '../../utils/getToBottom';

export interface InfiniteScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  disabled?: boolean;
  distance?: number;
  onLoadMore: () => void;
}

export const InfiniteScroll = React.forwardRef<HTMLDivElement, InfiniteScrollProps>(
  (props, ref) => {
    const { className, disabled, distance = 0, children, onLoadMore, onScroll, ...other } = props;
    const wrapperRef = useForwardRef(ref);

    function handleScroll(e: React.UIEvent<HTMLDivElement>) {
      if (onScroll) {
        onScroll(e);
      }

      const el = wrapperRef.current;
      if (!el) return;

      const nearBottom = getToBottom(el) <= distance;

      if (nearBottom) {
        onLoadMore();
      }
    }

    return (
      <div
        className={clsx('InfiniteScroll', className)}
        role="feed"
        onScroll={!disabled ? handleScroll : undefined}
        ref={wrapperRef}
        {...other}
      >
        {children}
      </div>
    );
  },
);

// Contents of ./components/Input/index.tsx

import React, { useState, useEffect, useContext, useCallback } from 'react';
import clsx from 'clsx';
import { ThemeContext } from '../Form';
import useForwardRef from '../../hooks/useForwardRef';

function getCount(value: InputProps['value'], maxLength?: number) {
  return `${`${value}`.length}${maxLength ? `/${maxLength}` : ''}`;
}

export type InputVariant = 'outline' | 'filled' | 'flushed';

export type InputRef = HTMLInputElement | HTMLTextAreaElement;

export interface InputProps extends Omit<React.InputHTMLAttributes<InputRef>, 'onChange'> {
  variant?: InputVariant;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  maxLength?: number;
  showCount?: boolean;
  multiline?: boolean;
  autoSize?: boolean;
  onChange?: (value: string, event: React.ChangeEvent<InputRef>) => void;
}

export const Input = React.forwardRef<InputRef, InputProps>((props, ref) => {
  const {
    className,
    type = 'text',
    variant: oVariant,
    value,
    placeholder,
    rows: oRows = 1,
    minRows = oRows,
    maxRows = 5,
    maxLength,
    showCount = !!maxLength,
    multiline,
    autoSize,
    onChange,
    ...other
  } = props;

  let initialRows = oRows;
  if (initialRows < minRows) {
    initialRows = minRows;
  } else if (initialRows > maxRows) {
    initialRows = maxRows;
  }

  const [rows, setRows] = useState(initialRows);
  const [lineHeight, setLineHeight] = useState(21);
  const inputRef = useForwardRef<any>(ref);
  const theme = useContext(ThemeContext);
  const variant = oVariant || (theme === 'light' ? 'flushed' : 'outline');
  const isMultiline = multiline || autoSize || oRows > 1;
  const Element = isMultiline ? 'textarea' : 'input';

  useEffect(() => {
    if (!inputRef.current) return;

    const lhStr = getComputedStyle(inputRef.current, null).lineHeight;
    const lh = Number(lhStr.replace('px', ''));

    if (lh !== lineHeight) {
      setLineHeight(lh);
    }
  }, [inputRef, lineHeight]);

  const updateRow = useCallback(() => {
    if (!autoSize || !inputRef.current) return;

    const target = inputRef.current as HTMLTextAreaElement;
    const prevRows = target.rows;
    target.rows = minRows;

    if (placeholder) {
      target.placeholder = '';
    }

    // eslint-disable-next-line no-bitwise
    const currentRows = ~~(target.scrollHeight / lineHeight);

    if (currentRows === prevRows) {
      target.rows = currentRows;
    }

    if (currentRows >= maxRows) {
      target.rows = maxRows;
      target.scrollTop = target.scrollHeight;
    }

    setRows(currentRows < maxRows ? currentRows : maxRows);

    if (placeholder) {
      target.placeholder = placeholder;
    }
  }, [autoSize, inputRef, lineHeight, maxRows, minRows, placeholder]);

  useEffect(() => {
    if (value === '') {
      setRows(initialRows);
    } else {
      updateRow();
    }
  }, [initialRows, updateRow, value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<InputRef>) => {
      updateRow();

      if (onChange) {
        const valueFromEvent = e.target.value;
        const shouldTrim = maxLength && valueFromEvent.length > maxLength;
        const val = shouldTrim ? valueFromEvent.substr(0, maxLength) : valueFromEvent;
        onChange(val, e);
      }
    },
    [maxLength, onChange, updateRow],
  );

  const input = (
    <Element
      className={clsx('Input', `Input--${variant}`, className)}
      type={type}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      ref={inputRef}
      rows={rows}
      onChange={handleChange}
      {...other}
    />
  );

  if (showCount) {
    return (
      <div className={clsx('InputWrapper', { 'has-counter': showCount })}>
        {input}
        {showCount && <div className="Input-counter">{getCount(value, maxLength)}</div>}
      </div>
    );
  }
  return input;
});

// Contents of ./components/Label/index.tsx

/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  const { children, ...other } = props;

  return (
    <label className="Label" {...other} ref={ref}>
      {children}
    </label>
  );
});

// Contents of ./components/LazyComponent/index.tsx

import React from 'react';
import { SuspenseWrap } from './SuspenseWrap';
import {
  LazyComponentProps,
  LazyComponentPropsWithCode,
  LazyComponentOnLoadParams,
} from './interface';
import { useComponents } from '../ComponentsProvider/useComponents';

export type { LazyComponentProps, LazyComponentOnLoadParams };

export const LazyComponentWithCode = (props: LazyComponentPropsWithCode) => {
  const { code, fallback, onLoad, onError, ...rest } = props;
  const { getComponent } = useComponents();

  const Comp = getComponent(code, (res) => {
    if ('async' in res && onLoad) {
      onLoad(res);
    } else if ('errCode' in res && onError) {
      onError(new Error(res.errCode));
    }
  });

  return <SuspenseWrap component={Comp} onError={onError} fallback={fallback} {...rest} />;
};

export const LazyComponent = (props: LazyComponentProps) => {
  const { component, code, onLoad, ...rest } = props;

  if (component) {
    if (onLoad) {
      onLoad({ async: false, component });
    }
    return <SuspenseWrap component={component} {...rest} />;
  }

  return <LazyComponentWithCode code={code} onLoad={onLoad} {...rest} />;
};

export default LazyComponent;

// Contents of ./components/Loading/index.tsx

import React from 'react';
import { Flex } from '../Flex';
import { Icon } from '../Icon';

export interface LoadingProps {
  tip?: string;
  children?: React.ReactNode;
}

export const Loading = (props: LoadingProps) => {
  const { tip, children } = props;
  return (
    <Flex className="Loading" center>
      <Icon type="spinner" spin />
      {tip && <p className="Loading-tip">{tip}</p>}
      {children}
    </Flex>
  );
};

// Contents of ./components/MediaObject/index.tsx

import React from 'react';
import clsx from 'clsx';

export type MediaObjectProps = {
  className?: string;
  picUrl?: string;
  picAlt?: string;
  picSize?: 'sm' | 'md' | 'lg';
  title?: string;
  meta?: React.ReactNode;
};

export const MediaObject = (props: MediaObjectProps) => {
  const { className, picUrl, picSize, title, picAlt, meta } = props;
  return (
    <div className={clsx('MediaObject', className)}>
      {picUrl && (
        <div className={clsx('MediaObject-pic', picSize && `MediaObject-pic--${picSize}`)}>
          <img src={picUrl} alt={picAlt || title} />
        </div>
      )}
      <div className="MediaObject-info">
        <h3 className="MediaObject-title">{title}</h3>
        <div className="MediaObject-meta">{meta}</div>
      </div>
    </div>
  );
};

// Contents of ./components/MessageContainer/index.tsx

/* eslint-disable no-underscore-dangle */
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import { PullToRefresh, PullToRefreshHandle, ScrollToEndOptions } from '../PullToRefresh';
import { Message, MessageProps } from '../Message';
import { BackBottom } from '../BackBottom';
import canUse from '../../utils/canUse';
import throttle from '../../utils/throttle';
import getToBottom from '../../utils/getToBottom';

const listenerOpts = canUse('passiveListener') ? { passive: true } : false;

export interface MessageContainerProps {
  messages: MessageProps[];
  renderMessageContent: (message: MessageProps) => React.ReactNode;
  isTyping?: boolean;
  loadMoreText?: string;
  onRefresh?: () => Promise<any>;
  onScroll?: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  renderBeforeMessageList?: () => React.ReactNode;
  onBackBottomShow?: () => void;
  onBackBottomClick?: () => void;
}

export interface MessageContainerHandle {
  ref: React.RefObject<HTMLDivElement>;
  scrollToEnd: (options?: ScrollToEndOptions) => void;
}

function isNearBottom(el: HTMLElement, n: number) {
  const offsetHeight = Math.max(el.offsetHeight, 600);
  return getToBottom(el) < offsetHeight * n;
}

export const MessageContainer = React.forwardRef<MessageContainerHandle, MessageContainerProps>(
  (props, ref) => {
    const {
      messages,
      isTyping,
      loadMoreText,
      onRefresh,
      onScroll,
      renderBeforeMessageList,
      renderMessageContent,
      onBackBottomShow,
      onBackBottomClick,
    } = props;

    const [showBackBottom, setShowBackBottom] = useState(false);
    const [newCount, setNewCount] = useState(0);
    const showBackBottomtRef = useRef(showBackBottom);
    const newCountRef = useRef(newCount);
    const messagesRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<PullToRefreshHandle>(null);
    const lastMessage = messages[messages.length - 1];

    const clearBackBottom = () => {
      setNewCount(0);
      setShowBackBottom(false);
    };

    const scrollToEnd = useCallback((opts?: ScrollToEndOptions) => {
      if (scrollerRef.current) {
        if (!showBackBottomtRef.current || (opts && opts.force)) {
          scrollerRef.current.scrollToEnd(opts);
          if (showBackBottomtRef.current) {
            clearBackBottom();
          }
        }
      }
    }, []);

    const handleBackBottomClick = () => {
      scrollToEnd({ animated: false, force: true });
      // setNewCount(0);
      // setShowBackBottom(false);

      if (onBackBottomClick) {
        onBackBottomClick();
      }
    };

    const checkShowBottomRef = useRef(
      throttle((el: HTMLElement) => {
        if (isNearBottom(el, 3)) {
          if (newCountRef.current) {
            // 如果有新消息，离底部0.5屏-隐藏提示
            if (isNearBottom(el, 0.5)) {
              // setNewCount(0);
              // setShowBackBottom(false);
              clearBackBottom();
            }
          } else {
            setShowBackBottom(false);
          }
        } else {
          // 3屏+显示回到底部
          setShowBackBottom(true);
        }
      }),
    );

    const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      checkShowBottomRef.current(e.target);

      if (onScroll) {
        onScroll(e);
      }
    };

    useEffect(() => {
      newCountRef.current = newCount;
    }, [newCount]);

    useEffect(() => {
      showBackBottomtRef.current = showBackBottom;
    }, [showBackBottom]);

    useEffect(() => {
      const scroller = scrollerRef.current;
      const wrapper = scroller && scroller.wrapperRef.current;

      if (!wrapper || !lastMessage || lastMessage.position === 'pop') {
        return;
      }

      if (lastMessage.position === 'right') {
        // 自己发的消息，强制滚动到底部
        scrollToEnd({ force: true });
      } else if (isNearBottom(wrapper, 2)) {
        const animated = !!wrapper.scrollTop;
        scrollToEnd({ animated, force: true });
      } else {
        setNewCount((c) => c + 1);
        setShowBackBottom(true);
      }
    }, [lastMessage, scrollToEnd]);

    useEffect(() => {
      scrollToEnd();
    }, [isTyping, scrollToEnd]);

    useEffect(() => {
      const wrapper = messagesRef.current!;

      let needBlur = false;
      let startY = 0;

      function reset() {
        needBlur = false;
        startY = 0;
      }

      function touchStart(e: TouchEvent) {
        const { activeElement } = document;
        if (activeElement && activeElement.nodeName === 'TEXTAREA') {
          needBlur = true;
          startY = e.touches[0].clientY;
        }
      }

      function touchMove(e: TouchEvent) {
        if (needBlur && Math.abs(e.touches[0].clientY - startY) > 20) {
          (document.activeElement as HTMLElement).blur();
          reset();
        }
      }

      wrapper.addEventListener('touchstart', touchStart, listenerOpts);
      wrapper.addEventListener('touchmove', touchMove, listenerOpts);
      wrapper.addEventListener('touchend', reset);
      wrapper.addEventListener('touchcancel', reset);

      return () => {
        wrapper.removeEventListener('touchstart', touchStart);
        wrapper.removeEventListener('touchmove', touchMove);
        wrapper.removeEventListener('touchend', reset);
        wrapper.removeEventListener('touchcancel', reset);
      };
    }, []);

    useImperativeHandle(ref, () => ({ ref: messagesRef, scrollToEnd }), [scrollToEnd]);

    return (
      <div className="MessageContainer" ref={messagesRef} tabIndex={-1}>
        {renderBeforeMessageList && renderBeforeMessageList()}
        <PullToRefresh
          onRefresh={onRefresh}
          onScroll={handleScroll}
          loadMoreText={loadMoreText}
          ref={scrollerRef}
        >
          <div className="MessageList">
            {messages.map((msg) => (
              <Message {...msg} renderMessageContent={renderMessageContent} key={msg._id} />
            ))}
            {isTyping && <Message type="typing" _id="typing" />}
          </div>
        </PullToRefresh>
        {showBackBottom && (
          <BackBottom
            count={newCount}
            onClick={handleBackBottomClick}
            onDidMount={onBackBottomShow}
          />
        )}
      </div>
    );
  },
);

// Contents of ./components/MessageStatus/index.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';

export type IMessageStatus = 'pending' | 'sent' | 'fail';

type StatusType = '' | 'loading' | 'fail';

export interface MessageStatusProps {
  status: IMessageStatus;
  delay?: number;
  maxDelay?: number;
  onRetry?: () => void;
  onChange?: (type: StatusType) => void;
}

export const MessageStatus = ({
  status,
  delay = 1500,
  maxDelay = 5000,
  onRetry,
  onChange,
}: MessageStatusProps) => {
  const [type, setType] = useState<StatusType>('');
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const failTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const doTimeout = useCallback(() => {
    loadingTimerRef.current = setTimeout(() => {
      setType('loading');
    }, delay);

    failTimerRef.current = setTimeout(() => {
      setType('fail');
    }, maxDelay);
  }, [delay, maxDelay]);

  function clear() {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    if (failTimerRef.current) {
      clearTimeout(failTimerRef.current);
    }
  }

  useEffect(() => {
    clear();
    if (status === 'pending') {
      doTimeout();
    } else if (status === 'sent') {
      setType('');
    } else if (status === 'fail') {
      setType('fail');
    }

    return clear;
  }, [status, doTimeout]);

  useEffect(() => {
    if (onChange) {
      onChange(type);
    }
  }, [onChange, type]);

  function handleRetry() {
    setType('loading');
    doTimeout();
    if (onRetry) {
      onRetry();
    }
  }

  if (type) {
    return (
      <div className="MessageStatus" data-status={type}>
        {type === 'fail' ? (
          <IconButton icon="warning-circle-fill" onClick={handleRetry} />
        ) : (
          <Icon type="spinner" spin onClick={handleRetry} />
        )}
      </div>
    );
  }

  return null;
};

// Contents of ./components/Navbar/index.tsx

import React from 'react';
import clsx from 'clsx';
import { IconButton, IconButtonProps } from '../IconButton';

export interface NavbarProps {
  title: string;
  className?: string;
  logo?: string;
  leftContent?: IconButtonProps;
  rightContent?: IconButtonProps[];
  desc?: React.ReactNode;
  align?: 'left' | 'center';
}

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>((props, ref) => {
  const { className, title, logo, desc, leftContent, rightContent = [], align } = props;

  const isLeft = align === 'left';
  const showTitle = isLeft ? true : !logo;

  return (
    <header className={clsx('Navbar', { 'Navbar--left': isLeft }, className)} ref={ref}>
      <div className="Navbar-left">{leftContent && <IconButton size="lg" {...leftContent} />}</div>
      <div className="Navbar-main">
        {logo && <img className="Navbar-logo" src={logo} alt={title} />}
        <div className="Navbar-inner">
          {showTitle && <h2 className="Navbar-title">{title}</h2>}
          <div className="Navbar-desc">{desc}</div>
        </div>
      </div>
      <div className="Navbar-right">
        {rightContent.map((item) => (
          <IconButton size="lg" key={item.icon} {...item} />
        ))}
      </div>
    </header>
  );
});

// Contents of ./components/Notice/index.tsx

import React from 'react';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { Text } from '../Text';

export interface NoticeProps {
  content: string;
  closable?: boolean;
  leftIcon?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onClose?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const Notice = (props: NoticeProps) => {
  const { content, closable = true, leftIcon = 'bullhorn', onClick, onClose } = props;

  return (
    <div className="Notice" role="alert" aria-atomic aria-live="assertive">
      {leftIcon && <Icon className="Notice-icon" type={leftIcon} />}
      <div className="Notice-content" onClick={onClick}>
        <Text className="Notice-text" truncate>
          {content}
        </Text>
      </div>
      {closable && (
        <IconButton className="Notice-close" icon="close" onClick={onClose} aria-label="关闭通知" />
      )}
    </div>
  );
};

// Contents of ./components/Popover/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import useMount from '../../hooks/useMount';
import useClickOutside from '../../hooks/useClickOutside';
import useWindowResize from '../../hooks/useWindowResize';

export type PopoverProps = {
  className?: string;
  active: boolean;
  target: HTMLElement;
  onClose: () => void;
  children?: React.ReactNode;
};

export const Popover = (props: PopoverProps) => {
  const { className, active, target, children, onClose } = props;
  const wrapper = useClickOutside(onClose, 'mousedown');
  const { didMount, isShow } = useMount({ active, ref: wrapper });
  const [style, setStyle] = useState({});

  const updatePos = useCallback(() => {
    if (!wrapper.current) return;

    const targetRect = target.getBoundingClientRect();
    const rect = wrapper.current.getBoundingClientRect();

    setStyle({
      top: `${targetRect.top - rect.height}px`,
      left: `${targetRect.left}px`,
    });
  }, [target, wrapper]);

  useEffect(() => {
    if (wrapper.current) {
      wrapper.current.focus();
      updatePos();
    }
  }, [didMount, updatePos, wrapper]);

  useWindowResize(updatePos);

  if (!didMount) return null;

  return createPortal(
    <div className={clsx('Popover', className, { active: isShow })} ref={wrapper} style={style}>
      <div className="Popover-body">{children}</div>
      <svg className="Popover-arrow" viewBox="0 0 9 5">
        <polygon points="0,0 5,5, 9,0" />
      </svg>
    </div>,
    document.body,
  );
};

// Contents of ./components/Price/index.tsx

/* eslint-disable react/no-array-index-key */
import React from 'react';
import clsx from 'clsx';

export interface PriceProps extends React.HTMLAttributes<HTMLDivElement> {
  price: number;
  className?: string;
  locale?: string;
  currency?: string;
  original?: boolean;
}

const canFormat =
  'Intl' in window && typeof Intl.NumberFormat.prototype.formatToParts === 'function';

export const Price = React.forwardRef<HTMLDivElement, PriceProps>((props, ref) => {
  const { className, price, currency, locale, original, ...other } = props;
  let parts: any[] | void = [];

  if (locale && currency && canFormat) {
    parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(price);
  } else {
    parts = undefined;
  }

  if (!parts) {
    const decimal = '.';
    const [integer, fraction] = `${price}`.split(decimal);
    parts = [
      { type: 'currency', value: currency },
      { type: 'integer', value: integer },
      { type: 'decimal', value: fraction && decimal },
      { type: 'fraction', value: fraction },
    ];
  }

  return (
    <div className={clsx('Price', { 'Price--original': original }, className)} ref={ref} {...other}>
      {parts.map((t, i) =>
        t.value ? (
          <span className={`Price-${t.type}`} key={i}>
            {t.value}
          </span>
        ) : null,
      )}
    </div>
  );
});

// Contents of ./components/Progress/index.tsx

import React from 'react';
import clsx from 'clsx';

export type ProgressProps = {
  className?: string;
  value: number;
  status?: 'active' | 'success' | 'error';
};

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>((props, ref) => {
  const { className, value, status, children, ...other } = props;

  return (
    <div
      className={clsx('Progress', status && `Progress--${status}`, className)}
      ref={ref}
      {...other}
    >
      <div
        className="Progress-bar"
        role="progressbar"
        style={{ width: `${value}%` }}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {children}
      </div>
    </div>
  );
});

// Contents of ./components/PullToRefresh/index.tsx

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import clsx from 'clsx';
import { setTransform } from '../../utils/style';
import { Icon } from '../Icon';
import { Flex } from '../Flex';
import { Button } from '../Button';
import canUse from '../../utils/canUse';
import smoothScroll from '../../utils/smoothScroll';
import { useLatest } from '../../hooks/useLatest';

const canPassive = canUse('passiveListener');
const passiveOpts = canPassive ? { passive: true } : false;
const nonPassiveOpts = canPassive ? { passive: false } : false;

type PullToRefreshStatus = 'pending' | 'pull' | 'active' | 'loading';

export interface PullToRefreshProps {
  distance?: number;
  loadingDistance?: number;
  distanceRatio?: number;
  loadMoreText?: string;
  maxDistance?: number;
  onRefresh?: () => Promise<any>;
  onScroll?: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  renderIndicator?: (status: PullToRefreshStatus, distance: number) => React.ReactNode;
  children: React.ReactNode;
}

export interface ScrollToEndOptions {
  animated?: boolean;
  force?: boolean;
}

interface PTRScrollToOptions extends ScrollToEndOptions {
  y: number | '100%';
}

export interface PullToRefreshHandle {
  scrollTo: (opts: PTRScrollToOptions) => void;
  scrollToEnd: (opts?: ScrollToEndOptions) => void;
  wrapperRef: React.RefObject<HTMLDivElement>;
}

export const PullToRefresh = React.forwardRef<PullToRefreshHandle, PullToRefreshProps>(
  (props, ref) => {
    const {
      distance: oDistance = 30,
      loadingDistance = 30,
      maxDistance,
      distanceRatio = 2,
      loadMoreText = 'Load more',
      children,
      onScroll,
      onRefresh,
      renderIndicator = (status: PullToRefreshStatus) => {
        if (status === 'active' || status === 'loading') {
          return <Icon className="PullToRefresh-spinner" type="spinner" spin />;
        }
        return null;
      },
    } = props;

    const wrapperRef = useRef<HTMLDivElement>(null!);
    const contentRef = useRef<HTMLDivElement>(null);
    const onRefreshRef = useLatest(onRefresh);

    const [distance, setDistance] = useState(0);
    const [status, setStatus] = useState<PullToRefreshStatus>('pending');
    const [dropped, setDropped] = useState(false);
    const [disabled, setDisabled] = useState(!props.onRefresh);
    const sharedRef = useRef<any>({});
    const statusRef = useRef<PullToRefreshStatus>(status);
    const timer1 = useRef<ReturnType<typeof setTimeout>>();
    const timer2 = useRef<ReturnType<typeof setTimeout>>();

    const useFallback = !canUse('touch');

    useEffect(() => {
      statusRef.current = status;
    }, [status]);

    const setContentStyle = (y: number) => {
      const content = contentRef.current;
      if (content) {
        setTransform(content, `translate3d(0px,${y}px,0)`);
      }
    };

    const scrollTo = ({ y, animated = true }: PTRScrollToOptions) => {
      const scroller = wrapperRef.current;

      if (!scroller) return;

      const offsetTop = y === '100%' ? scroller.scrollHeight - scroller.offsetHeight : y;

      if (animated) {
        smoothScroll({
          el: scroller,
          to: offsetTop,
          x: false,
        });
      } else {
        scroller.scrollTop = offsetTop;
      }
    };

    const scrollToEnd = useCallback(({ animated = true }: ScrollToEndOptions = {}) => {
      scrollTo({ y: '100%', animated });
    }, []);

    const reset = useCallback(() => {
      setDistance(0);
      setStatus('pending');
      setContentStyle(0);
    }, []);

    const handleLoadMore = useCallback(() => {
      const scroller = wrapperRef.current;

      if (!scroller || !onRefreshRef.current) return;

      setStatus('loading');

      try {
        const sh = scroller.scrollHeight;

        onRefreshRef.current().then((res) => {
          const handleOffset = () => {
            scrollTo({
              y: scroller.scrollHeight - sh - 50,
              animated: false,
            });
          };

          clearTimeout(timer1.current);
          clearTimeout(timer2.current);
          handleOffset();
          timer1.current = setTimeout(handleOffset, 150);
          timer2.current = setTimeout(handleOffset, 250);

          reset();

          if (res && res.noMore) {
            setDisabled(true);
          }
        });
      } catch (ex) {
        // eslint-disable-next-line no-console
        console.error(ex);
        reset();
      }
    }, [onRefreshRef, reset]);

    const touchStart = () => {
      sharedRef.current.startY = 0;
    };

    const touchMove = useCallback(
      (e: TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const canPull = wrapperRef.current.scrollTop <= 0;

        if (canPull) {
          if (!sharedRef.current.startY) {
            sharedRef.current.startY = currentY;
            setStatus('pull');
            setDropped(false);
          }
        } else {
          sharedRef.current.startY = 0;
        }

        const { startY } = sharedRef.current;

        if (!canPull || currentY < startY || statusRef.current === 'loading') return;

        let dist = (currentY - startY) / distanceRatio;

        if (maxDistance && dist > maxDistance) {
          dist = maxDistance;
        }

        if (dist > 0) {
          if (e.cancelable) {
            e.preventDefault();
          }
          e.stopPropagation();

          setContentStyle(dist);
          setDistance(dist);
          setStatus(dist >= oDistance ? 'active' : 'pull');
        }
      },
      [distanceRatio, maxDistance, oDistance],
    );

    const touchEnd = useCallback(() => {
      setDropped(true);

      if (sharedRef.current.startY && statusRef.current === 'active') {
        handleLoadMore();
      } else {
        reset();
      }
    }, [handleLoadMore, reset]);

    useEffect(() => {
      const wrapper = wrapperRef.current;

      if (!wrapper || useFallback) return;

      if (disabled) {
        wrapper.removeEventListener('touchstart', touchStart);
        wrapper.removeEventListener('touchmove', touchMove);
        wrapper.removeEventListener('touchend', touchEnd);
        wrapper.removeEventListener('touchcancel', touchEnd);
      } else {
        wrapper.addEventListener('touchstart', touchStart, passiveOpts);
        wrapper.addEventListener('touchmove', touchMove, nonPassiveOpts);
        wrapper.addEventListener('touchend', touchEnd);
        wrapper.addEventListener('touchcancel', touchEnd);
      }
    }, [disabled, touchEnd, touchMove, useFallback]);

    useEffect(() => {
      if (status === 'loading' && !useFallback) {
        setContentStyle(loadingDistance);
      }
    }, [loadingDistance, status, useFallback]);

    useImperativeHandle(
      ref,
      () => ({
        scrollTo,
        scrollToEnd,
        wrapperRef,
      }),
      [scrollToEnd],
    );

    return (
      <div className="PullToRefresh" ref={wrapperRef} onScroll={onScroll}>
        <div className="PullToRefresh-inner">
          <div
            className={clsx('PullToRefresh-content', {
              'PullToRefresh-transition': dropped,
            })}
            ref={contentRef}
          >
            <div className="PullToRefresh-indicator">{renderIndicator(status, distance)}</div>
            {!disabled && useFallback && (
              <Flex className="PullToRefresh-fallback" center>
                {renderIndicator(status, oDistance)}
                <Button className="PullToRefresh-loadMore" variant="text" onClick={handleLoadMore}>
                  {loadMoreText}
                </Button>
              </Flex>
            )}
            {React.Children.only(children)}
          </div>
        </div>
      </div>
    );
  },
);

// Contents of ./components/RateActions/index.tsx

import React, { useState } from 'react';
import clsx from 'clsx';
import { IconButton } from '../IconButton';
import { useLocale } from '../ConfigProvider';

const UP = 'up';
const DOWN = 'down';

export interface RateActionsProps {
  upTitle?: string;
  downTitle?: string;
  onClick: (value: string) => void;
}

export const RateActions = (props: RateActionsProps) => {
  const { trans } = useLocale('RateActions', {
    up: '赞同',
    down: '反对',
  });

  const { upTitle = trans('up'), downTitle = trans('down'), onClick } = props;
  const [value, setValue] = useState('');

  function handleClick(val: string) {
    if (!value) {
      setValue(val);
      onClick(val);
    }
  }

  function handleUpClick() {
    handleClick(UP);
  }

  function handleDownClick() {
    handleClick(DOWN);
  }

  return (
    <div className="RateActions">
      {value !== DOWN && (
        <IconButton
          className={clsx('RateBtn', { active: value === UP })}
          title={upTitle}
          data-type={UP}
          icon="thumbs-up"
          onClick={handleUpClick}
        />
      )}
      {value !== UP && (
        <IconButton
          className={clsx('RateBtn', { active: value === DOWN })}
          title={downTitle}
          data-type={DOWN}
          icon="thumbs-down"
          onClick={handleDownClick}
        />
      )}
    </div>
  );
};

// Contents of ./components/Recorder/index.tsx

import React, { useState, useEffect, useRef, useImperativeHandle, useCallback } from 'react';
import clsx from 'clsx';
import { Flex } from '../Flex';
import { Icon } from '../Icon';
import { useLocale } from '../ConfigProvider';
import canUse from '../../utils/canUse';

const canPassive = canUse('passiveListener');
const listenerOpts = canPassive ? { passive: true } : false;
const listenerOptsWithoutPassive = canPassive ? { passive: false } : false;
const MOVE_INTERVAL = 80;

interface ButtonTextMap {
  [k: string]: string;
}

const btnTextMap: ButtonTextMap = {
  inited: 'hold2talk',
  recording: 'release2send',
  willCancel: 'release2send',
};

let ts = 0;
let startY = 0;

export interface RecorderHandle {
  stop: () => void;
}

export interface RecorderProps {
  canRecord?: boolean;
  volume?: number;
  onStart?: () => void;
  onEnd?: (data: { duration: number }) => void;
  onCancel?: () => void;
  ref?: React.MutableRefObject<RecorderHandle>;
}

export const Recorder = React.forwardRef<RecorderHandle, RecorderProps>((props, ref) => {
  const { volume, onStart, onEnd, onCancel } = props;
  const [status, setStatus] = useState('inited');
  const btnRef = useRef<HTMLDivElement>(null);
  const { trans } = useLocale('Recorder');

  const doEnd = useCallback(() => {
    const duration = Date.now() - ts;
    if (onEnd) {
      onEnd({ duration });
    }
  }, [onEnd]);

  useImperativeHandle(ref, () => ({
    stop() {
      setStatus('inited');
      doEnd();
      ts = 0;
    },
  }));

  useEffect(() => {
    const wrapper = btnRef.current!;

    function handleTouchStart(e: TouchEvent) {
      if (e.cancelable) {
        e.preventDefault();
      }
      const touch0 = e.touches[0];
      startY = touch0.pageY;
      ts = Date.now();
      setStatus('recording');

      if (onStart) {
        onStart();
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (!ts) return;
      const nowY = e.touches[0].pageY;
      const isCancel = startY - nowY > MOVE_INTERVAL;
      setStatus(isCancel ? 'willCancel' : 'recording');
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!ts) return;
      const endY = e.changedTouches[0].pageY;
      const isRecording = startY - endY < MOVE_INTERVAL;

      setStatus('inited');

      if (isRecording) {
        doEnd();
      } else if (onCancel) {
        onCancel();
      }
    }

    wrapper.addEventListener('touchstart', handleTouchStart, listenerOptsWithoutPassive);
    wrapper.addEventListener('touchmove', handleTouchMove, listenerOpts);
    wrapper.addEventListener('touchend', handleTouchEnd);
    wrapper.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      wrapper.removeEventListener('touchstart', handleTouchStart);
      wrapper.removeEventListener('touchmove', handleTouchMove);
      wrapper.removeEventListener('touchend', handleTouchEnd);
      wrapper.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [doEnd, onCancel, onStart]);

  const isCancel = status === 'willCancel';
  const wavesStyle = { transform: `scale(${(volume || 1) / 100 + 1})` };

  return (
    <div className={clsx('Recorder', { 'Recorder--cancel': isCancel })} ref={btnRef}>
      {status !== 'inited' && (
        <Flex className="RecorderToast" direction="column" center>
          <div className="RecorderToast-waves" hidden={status !== 'recording'} style={wavesStyle}>
            <Icon className="RecorderToast-wave-1" type="hexagon" />
            <Icon className="RecorderToast-wave-2" type="hexagon" />
            <Icon className="RecorderToast-wave-3" type="hexagon" />
          </div>
          <Icon className="RecorderToast-icon" type={isCancel ? 'cancel' : 'mic'} />
          <span>{trans(isCancel ? 'release2cancel' : 'releaseOrSwipe')}</span>
        </Flex>
      )}
      <div className="Recorder-btn" role="button" aria-label={trans('hold2talk')}>
        <span>{trans(btnTextMap[status])}</span>
      </div>
    </div>
  );
});

// Contents of ./components/RichText/index.tsx

import React from 'react';
import clsx from 'clsx';
import DOMPurify from 'dompurify';
import './configDOMPurify';

export interface RichTextProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  className?: string;
  options?: DOMPurify.Config;
}

export const RichText = React.forwardRef<HTMLDivElement, RichTextProps>((props, ref) => {
  const { className, content, options = {}, ...other } = props;
  const html = {
    __html: DOMPurify.sanitize(content, options) as string,
  };

  return (
    <div
      className={clsx('RichText', className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={html}
      ref={ref}
      {...other}
    />
  );
});

// Contents of ./components/Search/index.tsx

import React, { useState } from 'react';
import clsx from 'clsx';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { Button } from '../Button';
import { Input, InputProps } from '../Input';
import { useLocale } from '../ConfigProvider';

export interface SearchProps extends Omit<InputProps, 'value'> {
  className?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  showSearch?: boolean;
  onSearch?: (
    query: string,
    event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
  onChange?: (value: string) => void;
  onClear?: () => void;
}

export const Search = React.forwardRef<HTMLDivElement, SearchProps>((props, ref) => {
  const {
    className,
    onSearch,
    onChange,
    onClear,
    value,
    clearable = true,
    showSearch = true,
    ...other
  } = props;

  const [query, setQuery] = useState(value || '');
  const { trans } = useLocale('Search');

  const handleChange = (val: string) => {
    setQuery(val);

    if (onChange) {
      onChange(val);
    }
  };

  const handleClear = () => {
    setQuery('');

    if (onClear) {
      onClear();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13) {
      if (onSearch) {
        onSearch(query, e);
      }
      e.preventDefault();
    }
  };

  const handleSearchClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (onSearch) {
      onSearch(query, e);
    }
  };

  return (
    <div className={clsx('Search', className)} ref={ref}>
      <Icon className="Search-icon" type="search" />
      <Input
        className="Search-input"
        type="search"
        value={query}
        enterKeyHint="search"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...other}
      />
      {clearable && query && (
        <IconButton className="Search-clear" icon="x-circle-fill" onClick={handleClear} />
      )}
      {showSearch && (
        <Button className="Search-btn" color="primary" onClick={handleSearchClick}>
          {trans('search')}
        </Button>
      )}
    </div>
  );
});

// Contents of ./components/Select/index.tsx

import React from 'react';
import clsx from 'clsx';
import { InputVariant } from '../Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  variant?: InputVariant;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, placeholder, variant = 'outline', children, ...rest }, ref) => (
    <select className={clsx('Input Select', `Input--${variant}`, className)} {...rest} ref={ref}>
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  ),
);

// Contents of ./components/Skeleton/index.tsx

import React from 'react';
import clsx from 'clsx';

export interface SkeletonProps {
  className?: string;
  w?: React.CSSProperties['width'];
  h?: React.CSSProperties['height'];
  mb?: React.CSSProperties['marginBottom'];
  style?: React.CSSProperties;
  r?: 'sm' | 'md' | 'xl' | 'none';
}

export const Skeleton = ({ className, w, h, mb, r, style }: SkeletonProps) => {
  return (
    <div
      className={clsx('Skeleton', r && `Skeleton--r-${r}`, className)}
      style={{ ...style, width: w, height: h, marginBottom: mb }}
    />
  );
};

// Contents of ./components/Tag/index.tsx

import React from 'react';
import clsx from 'clsx';

export interface TagProps {
  as?: React.ElementType;
  className?: string;
  color?: 'primary' | 'success' | 'danger' | 'warning';
  children?: React.ReactNode;
}

type TagRef = React.ElementType;

export const Tag = React.forwardRef<TagRef, TagProps>((props, ref) => {
  const { as: Element = 'span', className, color, children, ...other } = props;

  return (
    <Element className={clsx('Tag', color && `Tag--${color}`, className)} ref={ref} {...other}>
      {children}
    </Element>
  );
});

// Contents of ./components/Text/index.tsx

import React from 'react';
import clsx from 'clsx';

export interface TextProps {
  className?: string;
  as?: React.ElementType;
  align?: 'left' | 'center' | 'right' | 'justify';
  breakWord?: boolean;
  truncate?: boolean | number;
  children?: React.ReactNode;
}

export const Text = React.forwardRef<HTMLElement, TextProps>((props, ref) => {
  const { as: Element = 'div', className, align, breakWord, truncate, children, ...other } = props;
  const ellipsis = Number.isInteger(truncate);

  const cls = clsx(
    align && `Text--${align}`,
    {
      'Text--break': breakWord,
      'Text--truncate': truncate === true,
      'Text--ellipsis': ellipsis,
    },
    className,
  );

  const style = ellipsis ? { WebkitLineClamp: truncate } : null;

  return (
    <Element className={cls} style={style} {...other} ref={ref}>
      {children}
    </Element>
  );
});

// Contents of ./components/Toast/index.tsx

import React from 'react';
import { mountComponent } from '../../utils/mountComponent';
import { Toast, ToastProps } from './Toast';

function show(content: string, type?: ToastProps['type'], duration?: number) {
  mountComponent(<Toast content={content} type={type} duration={duration} />);
}

export const toast = {
  show,
  success(content: string, duration?: number) {
    show(content, 'success', duration);
  },
  fail(content: string, duration?: number) {
    show(content, 'error', duration);
  },
  loading(content: string, duration?: number) {
    show(content, 'loading', duration);
  },
};

export { Toast };
export type { ToastProps };

// Contents of ./components/Video/index.tsx

/* eslint-disable jsx-a11y/media-has-caption */
import React, { useState, useRef, useImperativeHandle } from 'react';
import clsx from 'clsx';
import { formatTime } from '../../utils/formatTime';

export interface VideoHandle {
  wrapperRef: React.RefObject<HTMLDivElement>;
}

export type VideoProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
  className?: string;
  src?: string;
  cover?: string;
  duration?: string | number;
  style?: React.CSSProperties;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onClick?: (paused: boolean, event: React.MouseEvent) => void;
  onCoverLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
};

export const Video = React.forwardRef<VideoHandle, VideoProps>((props, ref) => {
  const {
    className,
    src,
    cover,
    duration,
    onClick,
    onCoverLoad,
    style,
    videoRef: outerVideoRef,
    children,
    ...other
  } = props;

  const wrapperRef = useRef<HTMLDivElement>(null!);
  const localVideoRef = useRef<HTMLVideoElement>(null!);
  const videoRef = outerVideoRef || localVideoRef;

  const [isPlayed, setIsPlayed] = useState(false);
  const [paused, setPaused] = useState(true);

  function handleClick(e: React.MouseEvent) {
    setIsPlayed(true);
    const video = videoRef.current;

    if (video) {
      if (video.ended || video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
    if (onClick) {
      onClick(paused, e);
    }
  }

  function handlePlay() {
    setPaused(false);
  }

  function handlePause() {
    setPaused(true);
  }

  const hasCover = !isPlayed && !!cover;
  const hasDuration = hasCover && !!duration;

  useImperativeHandle(ref, () => ({
    wrapperRef,
  }));

  return (
    <div
      className={clsx('Video', `Video--${paused ? 'paused' : 'playing'}`, className)}
      style={style}
      ref={wrapperRef}
    >
      {hasCover && <img className="Video-cover" src={cover} onLoad={onCoverLoad} alt="" />}
      {hasDuration && <span className="Video-duration">{formatTime(+duration)}</span>}
      <video
        className="Video-video"
        src={src}
        ref={videoRef}
        hidden={hasCover}
        controls
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handlePause}
        {...other}
      >
        {children}
      </video>
      {hasCover && (
        <button className={clsx('Video-playBtn', { paused })} type="button" onClick={handleClick}>
          <span className="Video-playIcon" />
        </button>
      )}
    </div>
  );
});

// Contents of ./components/VisuallyHidden/index.tsx

import React from 'react';

const style = {
  position: 'absolute',
  height: '1px',
  width: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  margin: '-1px',
  // padding: 0,
  // border: 0,
  whiteSpace: 'nowrap',
};

export const VisuallyHidden = (props: any) => <span style={style} {...props} />;
