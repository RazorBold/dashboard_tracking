import { useState } from 'react';
import { Send, Loader2, Clock, CheckCircle2, XCircle, Radio } from 'lucide-react';
import { useDeviceCommands } from '../../hooks/useDeviceCommands';
import type { CommandType, CommandStatus, DeviceCommand } from '../../types/command';

interface Props {
  deviceId: string;
}

const COMMAND_LABELS: Record<CommandType, string> = {
  restart: 'Restart Device',
  set_interval: 'Set Report Interval',
  set_apn: 'Set APN',
};

const STATUS_CLASS: Record<CommandStatus, string> = {
  pending: 'cmd-badge cmd-badge--yellow',
  sent: 'cmd-badge cmd-badge--blue',
  executed: 'cmd-badge cmd-badge--green',
  failed: 'cmd-badge cmd-badge--red',
};

const STATUS_ICON: Record<CommandStatus, React.ReactNode> = {
  pending: <Clock size={11} />,
  sent: <Radio size={11} />,
  executed: <CheckCircle2 size={11} />,
  failed: <XCircle size={11} />,
};

function formatParams(cmd: DeviceCommand): string {
  if (!cmd.parameters) return '—';
  if (cmd.commandType === 'set_interval' && cmd.parameters.seconds != null) {
    return `${cmd.parameters.seconds}s`;
  }
  if (cmd.commandType === 'set_apn' && cmd.parameters.apn) {
    return cmd.parameters.apn;
  }
  return '—';
}

export function DeviceCommandPanel({ deviceId }: Props) {
  const [commandType, setCommandType] = useState<CommandType>('restart');
  const [seconds, setSeconds] = useState(30);
  const [apn, setApn] = useState('');

  const { history, send } = useDeviceCommands(deviceId);

  const handleSend = () => {
    const parameters =
      commandType === 'set_interval' ? { seconds } :
      commandType === 'set_apn' ? { apn } :
      undefined;

    send.mutate({ type: commandType, parameters });
  };

  return (
    <div className="cmd-panel">
      {/* Send Command Form */}
      <div className="cmd-panel__form">
        <h3 className="detail-sidebar__section-title">Send Command</h3>

        <div className="cmd-panel__field">
          <label className="detail-sidebar__label">Command</label>
          <select
            className="cmd-panel__select"
            value={commandType}
            onChange={(e) => setCommandType(e.target.value as CommandType)}
          >
            {(Object.keys(COMMAND_LABELS) as CommandType[]).map((cmd) => (
              <option key={cmd} value={cmd}>{COMMAND_LABELS[cmd]}</option>
            ))}
          </select>
        </div>

        {commandType === 'set_interval' && (
          <div className="cmd-panel__field">
            <label className="detail-sidebar__label">Interval (seconds)</label>
            <input
              type="number"
              className="cmd-panel__input"
              value={seconds}
              min={10}
              max={3600}
              onChange={(e) => setSeconds(Number(e.target.value))}
            />
            <span className="cmd-panel__hint">Min: 10s — Max: 3600s</span>
          </div>
        )}

        {commandType === 'set_apn' && (
          <div className="cmd-panel__field">
            <label className="detail-sidebar__label">APN</label>
            <input
              type="text"
              className="cmd-panel__input"
              value={apn}
              placeholder="e.g. internet"
              maxLength={100}
              onChange={(e) => setApn(e.target.value)}
            />
          </div>
        )}

        <button
          className="btn btn--primary cmd-panel__send-btn"
          onClick={handleSend}
          disabled={send.isPending || (commandType === 'set_apn' && !apn.trim())}
        >
          {send.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> Sending…</>
          ) : (
            <><Send size={14} /> Send Command</>
          )}
        </button>
      </div>

      {/* Command History */}
      <div className="cmd-panel__history">
        <h3 className="detail-sidebar__section-title">Command History</h3>

        {history.isLoading ? (
          <div className="cmd-panel__loading">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : !history.data?.length ? (
          <div className="cmd-panel__empty">No commands sent yet.</div>
        ) : (
          <div className="cmd-panel__list">
            {history.data.map((cmd) => (
              <div key={cmd.id} className="cmd-panel__item">
                <div className="cmd-panel__item-top">
                  <span className="cmd-panel__item-type">{COMMAND_LABELS[cmd.commandType]}</span>
                  <span className={STATUS_CLASS[cmd.status]}>
                    {STATUS_ICON[cmd.status]}
                    {cmd.status}
                  </span>
                </div>
                <div className="cmd-panel__item-meta">
                  {formatParams(cmd) !== '—' && (
                    <span className="cmd-panel__item-params">{formatParams(cmd)}</span>
                  )}
                  <span className="cmd-panel__item-time">
                    {new Date(cmd.sentAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
