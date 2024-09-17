import React from 'react';
import { useNavigate } from 'react-router-dom';
import Chat, {
  Bubble,
  MessageProps,
  useMessages,
  QuickReplyItemProps,
  useQuickReplies,
  // Card,
  CardMedia,
  CardTitle,
  CardText,
  CardActions,
  Button,
  List,
  ListItem,
  Flex,
  FlexItem,
  ScrollView,
  ToolbarItemProps,
  RateActions,
} from '../../../src';

import OrderSelector from './OrdderSelector';

type MessageWithoutId = Omit<MessageProps, '_id'>;

const initialMessages: MessageWithoutId[] = [
  {
    type: 'text',
    content: { text: 'Hi! What would you like to know about our products today?' },
    user: {
      avatar: 'https://avatars.githubusercontent.com/u/33565557?v=4',
      name: 'Dolly Assistant',
    },
    createdAt: Date.now(),
    hasTime: true,
  },
];

const defaultQuickReplies = [
  {
    icon: 'info-circle',
    name: 'What’s on sale today?',
    code: 'saleToday',
    isHighlight: true,
  },
  {
    icon: 'leaf',
    name: 'What fresh veggies do you have?',
    code: 'freshVeggies',
  },
  {
    icon: 'clock',
    name: 'What’s your store’s opening hours?',
    code: 'storeHours',
  },
  {
    icon: 'map-marker',
    name: 'Where is your store located?',
    code: 'storeLocation',
  },
  {
    icon: 'percent',
    name: 'Any promotions on fruits?',
    code: 'fruitPromotions',
  },
];

const skillList = [
  { title: '话费充值', desc: '智能充值智能充值' },
  { title: '评价管理', desc: '我的评价' },
  { title: '联系商家', desc: '急速联系' },
  { title: '红包卡券', desc: '使用优惠' },
  { title: '修改地址', desc: '修改地址' },
];


// eslint-disable-next-line @typescript-eslint/no-redeclare
const toolbar: ToolbarItemProps[] = [
  {
    type: 'smile',
    icon: 'smile',
    title: '表情',
  },
  {
    type: 'orderSelector',
    icon: 'shopping-bag',
    title: '宝贝',
  },
  {
    type: 'image',
    icon: 'image',
    title: '图片',
  },
  {
    type: 'camera',
    icon: 'camera',
    title: '拍照',
  },
  {
    type: 'photo',
    title: 'Photo',
    img: '//gw.alicdn.com/tfs/TB1eDjNj.T1gK0jSZFrXXcNCXXa-80-80.png',
  },
];


// Card component for displaying cards (for product details)
const Card = ({ content }: any) => (
  <div className="card">
    <h3>{content.title}</h3>
    <p>{content.text}</p>
    {content.media && content.media.image && (
      <img src={content.media.image} alt="product" style={{ maxWidth: '100px' }} />
    )}
    {content.actions &&
      content.actions.map((action: any, index: number) => (
        <button key={index} style={{ marginRight: '10px' }}>
          {action.text}
        </button>
      ))}
  </div>
);

// Main chat component
export default () => {

  const { messages, appendMsg, setTyping, prependMsgs } = useMessages(initialMessages);
  const { quickReplies, replace } = useQuickReplies(defaultQuickReplies);
  const msgRef = React.useRef(null);

  const navigate = useNavigate();

  window.appendMsg = appendMsg;
  window.msgRef = msgRef;

  // Fetching intent data based on the user's input
  async function fetchIntent(question: string): Promise<any> {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('API-Key', 'hT3vB6sJmZpQ8dR1nX9yA0wCf4lV7kW2');

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        store_id: 'local_store-2024',
        categories: ['Dairy', 'Bakery', 'Produce'],
        question,
        conversation_id: 239,
      }),
      redirect: 'follow',
    };

    try {
      const response = await fetch('http://engine.dollyassistant.com/search_intent', requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Failed to fetch intent');
    }
  }

  // Send callback for sending messages
  function handleSend(type: string, val: string) {
    if (type === 'text' && val.trim()) {
      // Append the user's message on the right side
      appendMsg({
        type: 'text',
        content: { text: val },
        position: 'right',
        user: {
          avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNL_ZnOTpXSvhf1UaK7beHey2BX42U6solRA&s',
        },
      });

      setTimeout(() => {
        setTyping(true);
      }, 1000);

      fetchIntent(val)
        .then((response) => {
          if (response && response.message) {
            // Append each message from the response
            response.message.forEach((msg: any) => {
              appendMsg({
                type: msg.type || 'text',
                content: msg.content,
                position: 'left',
                user: {
                  avatar: 'https://avatars.githubusercontent.com/u/33565557?v=4',
                  name: 'Dolly Assistant',
                },
              });
            });
          }

          // Update quick replies dynamically
          if (response && response.quickReplies) {
            const quickRepliesFromResponse = response.quickReplies.map((reply: any) => ({
              icon: reply.icon,
              name: reply.name,
              code: reply.code,
            }));
            replace(quickRepliesFromResponse);
          }
        })
        .catch((error) => {
          console.error(error);
          appendMsg({
            type: 'text',
            content: { text: 'Error: Failed to fetch intent' },
            position: 'left',
            user: {
              avatar: 'https://avatars.githubusercontent.com/u/33565557?v=4',
              name: 'Dolly Assistant',
            },
          });
        })
        .finally(() => {
          // Hide typing indicator after processing the response
          setTyping(false);
        });
    }
  };

  // Handle quick reply click
  const handleQuickReplyClick = (item: QuickReplyItemProps) => {
    handleSend('text', item.name);
  };

  function handleRefresh() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = Date.now();

        prependMsgs([
          {
            _id: now + '1111',
            type: 'text',
            content: { text: '11111Hi，我是你的专属智能助理小蜜，有问题请随时找我哦~' },
            user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
          },
          {
            _id: now + '2222',
            type: 'text',
            content: { text: '22222 Hi，我是你的专属智能助理小蜜，有问题请随时找我哦~' },
            user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
          },
          {
            _id: now + '3333',
            type: 'text',
            content: { text: '333 Hi，我是你的专属智能助理小蜜，有问题请随时找我哦~' },
            user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
          },
          {
            _id: now + '4444',
            type: 'text',
            content: { text: '444 Hi，我是你的专属智能助理小蜜，有问题请随时找我哦~' },
            user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
          },
          {
            _id: now + '5555',
            type: 'text',
            content: { text: '555 Hi，我是你的专属智能助理小蜜，有问题请随时找我哦~' },
            user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
          },
          {
            _id: now + '6666',
            type: 'text',
            content: { text: '666 Hi，我是你的专属智能助理小蜜，有问题请随时找我哦~' },
            user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
          },
          {
            _id: now + '7777',
            type: 'text',
            content: { text: '777 Hi，我是你的专属智能助理小蜜，有问题请随时找我哦~' },
            user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
          },
        ]);
        resolve({});
      }, 800);
    });
  }

  function handleToolbarClick(item: ToolbarItemProps) {
    if (item.type === 'orderSelector') {
      appendMsg({
        type: 'order-selector',
        content: {},
      });
    }
  }

  // Render message content based on its type
  function renderMessageContent(msg: MessageProps) {
    const { type, content } = msg;

    switch (type) {
      case 'text':
        return <Bubble content={content.text} />;
      case 'richtext':
        return <div dangerouslySetInnerHTML={{ __html: content.html }} />;
      case 'card':
        return <Card content={content} />;
      case 'guess-you':
        return (
          <Card fluid>
            <Flex>
              <div className="guess-you-aside">
                <h1>猜你想问</h1>
              </div>
              <FlexItem>
                <List>
                  <ListItem content="我的红包退款去哪里?" as="a" rightIcon="chevron-right" />
                  <ListItem content="我的红包退款去哪里?" as="a" rightIcon="chevron-right" />
                  <ListItem content="如何修改评价?" as="a" rightIcon="chevron-right" />
                  <ListItem content="物流问题咨询" as="a" rightIcon="chevron-right" />
                </List>
              </FlexItem>
            </Flex>
          </Card>
        );
      case 'skill-cards':
        return (
          <ScrollView
            className="skill-cards"
            data={skillList}
            fullWidth
            renderItem={(item) => (
              <Card>
                <CardTitle>{item.title}</CardTitle>
                <CardText>{item.desc}</CardText>
              </Card>
            )}
          />
        );
      case 'order-selector':
        return <OrderSelector />;
      case 'image':
        return (
          <Bubble type="image">
            <img src={content.picUrl} alt="" />
          </Bubble>
        );
      case 'image-text-button':
        return (
          <Flex>
            <Card fluid>
              <CardMedia image="//gw.alicdn.com/tfs/TB1Xv5_vlr0gK0jSZFnXXbRRXXa-427-240.png" />
              <CardTitle>Card title</CardTitle>
              <CardText>
                如您希望卖家尽快给您发货，可以进入【我的订单】找到该笔交易，点击【提醒发货】或点击【联系卖家】与卖家进行旺旺沟通尽快发货给您哦，若卖家明确表示无法发货，建议您申请退款重新选购更高品质的商品哦商品。申请退款重新选购更高品质的商品哦商品。
              </CardText>
              <CardActions>
                <Button>次要按钮</Button>
                <Button color="primary">主要按钮</Button>
              </CardActions>
            </Card>
            <RateActions onClick={console.log} />
          </Flex>
        );
      default:
        return <Bubble content={`Unsupported message type: ${type}`} />;
    }
  };


  return (
    <Chat
      elderMode
      onRefresh={handleRefresh}
      navbar={{
        leftContent: {
          icon: 'chevron-left',
          title: 'Back',
          onClick: () => navigate('/'),
        },
        rightContent: [
          {
            icon: 'apps',
            title: 'Applications',
            onClick: () => alert('Applications'),
          },
          {
            icon: 'ellipsis-h',
            title: 'More',
          },
        ],
        title: 'Punjabi Grocery Store',
        desc: 'Brampton, ON',
        logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1tmm0D7-XHCSC3QQJWi0oITTlueXiWeMcl1hwI5pr48_6Rv5_r2zx7SyXYCWcJzWQmkg&usqp=CAU',
        align: 'left',
      }}
      rightAction={{ icon: 'compass' }}
      toolbar={toolbar}
      messagesRef={msgRef}
      onToolbarClick={handleToolbarClick}
      recorder={{ canRecord: true }}
      wideBreakpoint="600px"
      messages={messages}
      renderMessageContent={renderMessageContent}
      quickReplies={quickReplies}
      onQuickReplyClick={handleQuickReplyClick}
      onSend={handleSend}
      onImageSend={() => Promise.resolve()}

    />
  );
};