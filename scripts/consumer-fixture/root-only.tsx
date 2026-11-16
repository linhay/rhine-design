import { createRoot } from 'react-dom/client';
import { Button, ColorPicker, TextField } from '@linhey/rhine-design';
// No theme entry or explicit CSS: this probes the root entry's automatic CSS.
createRoot(document.getElementById('root')!).render(<div className="rhine-theme" data-root-only><Button>主入口样式</Button><TextField label="根入口字段" defaultValue="源码包消费"/><ColorPicker label="根入口颜色" value="#123456" onChange={()=>undefined}/></div>);
