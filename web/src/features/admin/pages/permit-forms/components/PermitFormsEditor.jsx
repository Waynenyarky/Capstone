import React from 'react'
import { Input, Typography, Empty, Button, Tooltip } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import PermitFormCardEditor from './PermitFormCardEditor'
import { SECTION_DESCRIPTION_PLACEHOLDER } from '../constants'
import { reorderCards } from '../utils'

const { TextArea } = Input
const { Text } = Typography

export default function PermitFormsEditor({
  cards,
  sectionDescription,
  onUpdateCards,
  onUpdateDescription,
  onUpdateCard,
  onDeleteCard,
  token,
}) {
  const handleMoveUp = (index) => {
    if (index <= 0) return
    const newCards = reorderCards(cards, index, index - 1)
    onUpdateCards(newCards)
  }

  const handleMoveDown = (index) => {
    if (index >= cards.length - 1) return
    const newCards = reorderCards(cards, index, index + 1)
    onUpdateCards(newCards)
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
          Section Description
        </Text>
        <TextArea
          value={sectionDescription}
          onChange={(e) => onUpdateDescription(e.target.value)}
          placeholder={SECTION_DESCRIPTION_PLACEHOLDER}
          autoSize={{ minRows: 2, maxRows: 4 }}
          maxLength={1000}
        />
      </div>

      {cards.length === 0 ? (
        <Empty
          description="No permit form cards yet. Click 'Add Card' to create one."
          style={{ padding: '24px 0' }}
        />
      ) : (
        cards.map((card, index) => (
          <div key={card.cardId} style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: -36, top: 8, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 1 }}>
              <Tooltip title="Move up" placement="left">
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowUpOutlined />}
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                  style={{ padding: 0, width: 24, height: 24 }}
                />
              </Tooltip>
              <Tooltip title="Move down" placement="left">
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowDownOutlined />}
                  disabled={index === cards.length - 1}
                  onClick={() => handleMoveDown(index)}
                  style={{ padding: 0, width: 24, height: 24 }}
                />
              </Tooltip>
            </div>
            <PermitFormCardEditor
              card={card}
              onUpdate={onUpdateCard}
              onDelete={onDeleteCard}
              token={token}
            />
          </div>
        ))
      )}
    </div>
  )
}
