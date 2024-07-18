import React from 'react';
import { useNavigate } from 'react-router-dom';
import Chat, {
  Bubble,
  MessageProps,
  useMessages,
  QuickReplyItemProps,
  useQuickReplies,
  Card,
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
  Typing,
} from '../../../src';
import { DemoPage, DemoSection } from '../components';

import OrderSelector from './OrdderSelector';




type MessageWithoutId = Omit<MessageProps, '_id'>;


const initialMessages: MessageWithoutId[] = [
  // {
  //   type: 'system',
  //   content: { text: 'Chat started at ' + new Date().toLocaleTimeString() },
  // },
  // {
  //   type: 'text',
  //   content: { text: 'Hi, I am your exclusive smart assistant Xiaomi, feel free to ask me anything~' },
  //   user: {
  //     avatar: 'https://avatars.githubusercontent.com/u/33565557?v=4',
  //     name: 'Dolly Agent',
  //   },
  //   createdAt: Date.now(),
  //   hasTime: true,
  // },
  // {
  //   type: 'text',
  //   content: { text: 'Hello~' },
  //   user: {
  //     avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNL_ZnOTpXSvhf1UaK7beHey2BX42U6solRA&s',
  //     name: 'You',
  //   },
  //   createdAt: Date.now(),
  //   hasTime: true,
  //   position: 'right',
  // },
  {
    type: 'guess-you',
  },
  // {
  //   type: 'skill-cards',
  // },
  // {
  //   type: 'text',
  //   content: { text: 'Xiaomi, I want to check my logistics information' },
  //   position: 'right',
  //   user: { avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNL_ZnOTpXSvhf1UaK7beHey2BX42U6solRA&s' },
  // },
  // {
  //   type: 'image',
  //   content: {
  //     picUrl: '//img.alicdn.com/tfs/TB1p_nirYr1gK0jSZR0XXbP8XXa-300-300.png',
  //   },
  // },
  {
    type: 'system',
    content: {
      text: 'Due to inactivity or leaving Xiaomi (leaving the page, locking the screen, etc.), this service has automatically ended.',
    },
  },
  // {
  //   type: 'image-text-button',
  //   content: {},
  // },
];


// const defaultQuickReplies = [
//   {
//     icon: 'shopping-bag',
//     name: 'Order Inquiry (Highlighted)',
//     code: 'orderSelector',
//     isHighlight: true,
//   },
//   {
//     icon: 'shopping-bag',
//     name: 'How to Apply for a Refund (Highlighted)',
//     code: 'orderSelector',
//     isHighlight: true,
//   },
//   {
//     icon: 'message',
//     name: 'Contact Human Service (Highlighted + New)',
//     code: 'q1',
//     isNew: true,
//     isHighlight: true,
//   },
//   {
//     name: 'Quality Issues (New)',
//     code: 'q3',
//     isNew: true,
//   },
//   {
//     name: 'Seller Copywriting',
//     code: 'q4',
//   },
//   {
//     name: 'Top 5 Quick Phrases',
//     code: 'q5',
//   },
//   {
//     name: 'Bottom 6 Quick Phrases',
//     code: 'q6',
//   },
// ];



const defaultQuickReplies = [
  {
    icon: 'shopping-bag',
    name: 'Current Deals on Veggies',
    code: 'dealSelector',
  },
  {
    icon: 'shopping-bag',
    name: 'New Veggie Promotions',
    code: 'promoSelector',
  },
  {
    icon: 'message',
    name: 'Top-Rated Vegetables (New)',
    code: 'ratingSelector',
    isNew: true,
  },
  {
    name: 'Available Veggies Tomorrow (New)',
    code: 'availabilitySelector',
    isNew: true,
  },
  {
    name: 'Seasonal Veggies on Sale',
    code: 'seasonalSelector',
  },
  {
    name: 'Veggie Variety Packs',
    code: 'varietySelector',
  },
  {
    name: 'Best-Selling Veggies Prices',
    code: 'priceSelector',
  },
  {
    name: 'Recipe Suggestions with Veggies',
    code: 'recipeSelector',
  },
  {
    name: 'Bulk Discount on Veggies',
    code: 'bulkSelector',
  },
  {
    name: 'Coupons for Veggie Purchases',
    code: 'couponSelector',
  },
];




const skillList = [
  { title: 'Top-up', desc: 'Smart Top-up' },
  { title: 'Review Management', desc: 'My Reviews' },
  { title: 'Contact Seller', desc: 'Fast Contact' },
  { title: 'Red Packet Coupons', desc: 'Use Discounts' },
  { title: 'Change Address', desc: 'Update Address' },
];


// eslint-disable-next-line @typescript-eslint/no-redeclare
const toolbar: ToolbarItemProps[] = [
  {
    type: 'smile',
    icon: 'smile',
    title: 'Emoji',
  },
  {
    type: 'orderSelector',
    icon: 'shopping-bag',
    title: 'Products',
  },
  {
    type: 'image',
    icon: 'image',
    title: 'Image',
  },
  {
    type: 'camera',
    icon: 'camera',
    title: 'Take Photo',
  },
  {
    type: 'photo',
    title: 'Photo',
    img: '//gw.alicdn.com/tfs/TB1eDjNj.T1gK0jSZFrXXcNCXXa-80-80.png',
  },
];


//create a function for chat (that fetches the messages from the server)


// async function fetchIntent(question: string): Promise<string> {
//   const myHeaders = new Headers();
//   myHeaders.append("Content-Type", "application/json");
//   myHeaders.append("Origin", "http://127.0.0.1:5173");
//   myHeaders.append("Referer", "http://127.0.0.1:5173/");
//   myHeaders.append("API-Key", "hT3vB6sJmZpQ8dR1nX9yA0wCf4lV7kW2");

//   const raw = JSON.stringify({
//     store_id: "Example Store -28282",
//     categories: [
//       "Dairy",
//       "Bakery",
//       "Produce"
//     ],
//     question: question
//   });

//   const requestOptions: RequestInit = {
//     method: 'POST',
//     headers: myHeaders,
//     body: raw,
//     redirect: 'follow',
//     mode: 'cors',

//   };

//   try {
//     const response = await fetch("http://engine.dollyassistant.com/search_intent", requestOptions);
//     const result = await response.json();
//     return result;
//   } catch (error) {
//     console.error('Error:', error);
//     throw new Error('Failed to fetch intent');
//   }
// }


async function fetchIntent(question: string): Promise<string> {
  
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("API-Key", "hT3vB6sJmZpQ8dR1nX9yA0wCf4lV7kW2");


  const requestOptions: RequestInit = {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify({
      store_id: "Example Store -28282",
      categories: [
        "Dairy",
        "Bakery",
        "Produce"
      ],
      question: question
    }),
    redirect: 'follow',
    // mode: 'cors',
  };


  
  try {
    const response = await fetch("http://engine.dollyassistant.com/search_intent", requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('result', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Failed to fetch intent');
  }
}

async function functionCall(payloadd: object): Promise<string> {
  
  
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("API-Key", "hT3vB6sJmZpQ8dR1nX9yA0wCf4lV7kW2");


  const requestOptions: RequestInit = {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify(payloadd),
    redirect: 'follow',
    // mode: 'cors',
  };



  
  try {
    const response = await fetch("http://engine.dollyassistant.com/function_call", requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('result', result);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Failed to fetch intent');
  }
}



export default () => {
  // Use hooks

  const { messages, appendMsg, prependMsgs } = useMessages(initialMessages);
  const { quickReplies, replace } = useQuickReplies(defaultQuickReplies);
  const msgRef = React.useRef(null);

  const navigate = useNavigate();

  window.appendMsg = appendMsg;
  window.msgRef = msgRef;


 
// Send callback
function handleSend(type: string, val: string) {
  if (type === 'text' && val.trim()) {

    // TODO: Send request
    appendMsg({
      type: 'text',
      content: { 
        text: val,
      },
      position: 'right',
      // user: { avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNL_ZnOTpXSvhf1UaK7beHey2BX42U6solRA&s' },
       
    });


    fetchIntent(val)
    .then(response => setTimeout(() => {
    
     

      const functionIntent = response?.function_intent;

       // convert response to parse json
       console.log('response', functionIntent);

       // switch case for function intent

       if (functionIntent === 'direct_answer') {
        appendMsg({
          type: 'text',
          content: { text: response?.answer },
        });
      }
      else
      {
       
        functionCall(response).then(functionCallData =>
        {

        

        console.log('functionCallData', functionCallData);

        // check if functionCallData is not null

        if (functionCallData) {
          // appendMsg({
          //   type: 'text',
          //   content: { text: functionCallData },
          // });
        }
        else {
          appendMsg({
            type: 'text',
            content: { text: 'Sorry, this feature is not available right now' },
          });
        }
        });


        

        

      }

      



      


      // linksList.length > 0 && appendMsg({
      //   type: 'list',
      //   content: { list: linksList },
      // });
    }, 1500))


    
    .catch(error => 
       // Simulate reply message
    setTimeout(() => {
      appendMsg({
        type: 'text',
        content: { text: 'Error: Failed to fetch intent' }, // Error message
      });
    }, 1500)
    );
   
  }
}

// Quick reply callback, different actions can be taken based on item data, here sending a text message as an example
function handleQuickReplyClick(item: QuickReplyItemProps) {
  handleSend('text', item.name);

  if (item.code === 'q1') {
    replace([
      {
        name: 'Phrase A',
        code: 'qa',
        isHighlight: true,
      },
      {
        name: 'Phrase B',
        code: 'qb',
      },
    ]);
  } else if (item.code === 'orderSelector') {
    appendMsg({
      type: 'order-selector',
      content: {},
      position: 'pop',
    });
  }
}

function handleRefresh() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = Date.now();

      prependMsgs([
        {
          _id: now + '1111',
          type: 'text',
          content: { text: '11111 Hi, I am your exclusive smart assistant Xiaomi, feel free to ask me anything~' },
          user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
        },
        {
          _id: now + '2222',
          type: 'text',
          content: { text: '22222 Hi, I am your exclusive smart assistant Xiaomi, feel free to ask me anything~' },
          user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
        },
        {
          _id: now + '3333',
          type: 'text',
          content: { text: '333 Hi, I am your exclusive smart assistant Xiaomi, feel free to ask me anything~' },
          user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
        },
        {
          _id: now + '4444',
          type: 'text',
          content: { text: '444 Hi, I am your exclusive smart assistant Xiaomi, feel free to ask me anything~' },
          user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
        },
        {
          _id: now + '5555',
          type: 'text',
          content: { text: '555 Hi, I am your exclusive smart assistant Xiaomi, feel free to ask me anything~' },
          user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
        },
        {
          _id: now + '6666',
          type: 'text',
          content: { text: '666 Hi, I am your exclusive smart assistant Xiaomi, feel free to ask me anything~' },
          user: { avatar: '//gw.alicdn.com/tfs/TB1DYHLwMHqK1RjSZFEXXcGMXXa-56-62.svg' },
        },
        {
          _id: now + '7777',
          type: 'text',
          content: { text: '777 Hi, I am your exclusive smart assistant Xiaomi, feel free to ask me anything~' },
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

function renderMessageContent(msg: MessageProps) {
  const { type, content } = msg;

  // Render based on message type
  switch (type) {
    case 'text':
      return <Bubble content={content.text} />;
    case 'guess-you':
      return (
        <Card fluid>
          <Flex>
            {/* <div className="guess-you-aside">
              <h1>Guess what you want to ask</h1>
            </div> */}
            <FlexItem>
              <List>
                <ListItem content="Where is my red packet refund?" as="a" rightIcon="chevron-right" />
                <ListItem content="Where is my red packet refund?" as="a" rightIcon="chevron-right" />
                <ListItem content="How to modify review?" as="a" rightIcon="chevron-right" />
                <ListItem content="Logistics inquiry" as="a" rightIcon="chevron-right" />
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
      case 'list':
      return (
        <Card fluid>
          <Flex>
            <FlexItem>
              <List>
                {
                  content.list.map((item, index) => (
                    <ListItem key={index} content={'🍓 '+item.name} />
                  ))
                }
              </List>
           </FlexItem>
        </Flex>
        </Card>
      );
    case 'image-text-button':
      return (
        <Flex>
          <Card fluid>
            <CardMedia image="//gw.alicdn.com/tfs/TB1Xv5_vlr0gK0jSZFnXXbRRXXa-427-240.png" />
            <CardTitle>Card title</CardTitle>
            <CardText>
              If you want the seller to ship your order as soon as possible, you can go to [My Orders] to find the transaction,
              click [Remind to Ship] or click [Contact Seller] to chat with the seller and ask them to ship your order as soon as possible. If the seller clearly states that they cannot ship, we recommend applying for a refund and selecting a higher quality product.
            </CardText>
            <CardActions>
              <Button>Secondary Button</Button>
              <Button color="primary">Primary Button</Button>
            </CardActions>
          </Card>
          <RateActions onClick={console.log} />
        </Flex>
      );
    default:
      return null;
  }
}


  return (
    <Chat
      elderMode
      onRefresh={handleRefresh}
      navbar={{
        leftContent: {
          icon: 'chevron-left',
          title: 'Back',
          onClick() {
            navigate('/');
          },
        },
        rightContent: [
          {
            icon: 'apps',
            title: 'Applications',
            onClick() {
              alert('Applications');
            }
          },
          {
            icon: 'ellipsis-h', // ellipsis-h, compass, search, plus, smile, help, close
            title: 'More',
          },
        ],
        title: 'Punjabi Grocery Store',
        desc: 'Brampton, ON',
        logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1tmm0D7-XHCSC3QQJWi0oITTlueXiWeMcl1hwI5pr48_6Rv5_r2zx7SyXYCWcJzWQmkg&usqp=CAU',
        align: 'left', // left, center, right
      }}
      rightAction={{ icon: 'compass' }} // right action button
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
