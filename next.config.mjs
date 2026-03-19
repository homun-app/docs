import nextra from 'nextra'

const withNextra = nextra({
  // Content lives in src/content/
})

export default withNextra({
  output: 'export',
  images: { unoptimized: true },
})
