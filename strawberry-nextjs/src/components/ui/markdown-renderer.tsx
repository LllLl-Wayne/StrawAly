'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { jsonToMarkdown } from '@/lib/jsonToMarkdown'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Markdown渲染组件，支持直接渲染Markdown或JSON转Markdown
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // 尝试解析内容是否为JSON
  const processedContent = React.useMemo(() => {
    if (!content) return ''
    
    try {
      // 尝试解析JSON
      const jsonData = JSON.parse(content)
      return jsonToMarkdown(jsonData)
    } catch (e) {
      // 如果不是有效的JSON，直接返回原内容
      return content
    }
  }, [content])

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none w-full overflow-auto ${className}`}>
      <div className="text-gray-800 dark:text-gray-200">
        <ReactMarkdown>{processedContent}</ReactMarkdown>
      </div>
    </div>
  )
}