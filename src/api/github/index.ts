import { api } from '@/request'
import type { GithubTrendingResponse } from './types'

/**
 * 获取GitHub热门项目列表
 * @param since 时间范围，可选 (daily, weekly, monthly)
 * @returns GitHub热门项目列表
 */
export const getMockGithubTrending = async (
  since: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<GithubTrendingResponse> => {
  // 这里使用公开的GitHub Trending API
  // 实际项目中可能需要替换为自己的后端API或其他第三方服务
  return api.get({
    url: '/tool/github_trending',
    params: {
      since
    }
  })
}

// 模拟数据，用于开发阶段
// export const getMockGithubTrending = (): Promise<GithubTrendingResponse> => {
//   const mockData = {
//     code: 200,
//     message: 'success',
//     data: [
//       {
//         author: 'microsoft',
//         name: 'vscode',
//         avatar: 'https://github.com/microsoft.png',
//         url: 'https://github.com/microsoft/vscode',
//         description: 'Visual Studio Code',
//         language: 'TypeScript',
//         languageColor: '#2b7489',
//         stars: 145000,
//         forks: 24500,
//         currentPeriodStars: 1200,
//         builtBy: [
//           {
//             username: 'contributor1',
//             url: 'https://github.com/contributor1'
//           }
//         ]
//       },
//       {
//         author: 'vuejs',
//         name: 'vue',
//         avatar: 'https://github.com/vuejs.png',
//         url: 'https://github.com/vuejs/vue',
//         description: 'Vue.js is a progressive, incrementally-adoptable JavaScript framework for building UI on the web.',
//         language: 'JavaScript',
//         languageColor: '#f1e05a',
//         stars: 202000,
//         forks: 33000,
//         currentPeriodStars: 800,
//         builtBy: [
//           {
//             username: 'contributor2',
//             url: 'https://github.com/contributor2'
//           }
//         ]
//       },
//       {
//         author: 'facebook',
//         name: 'react',
//         avatar: 'https://github.com/facebook.png',
//         url: 'https://github.com/facebook/react',
//         description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
//         language: 'JavaScript',
//         languageColor: '#f1e05a',
//         stars: 195000,
//         forks: 40000,
//         currentPeriodStars: 750,
//         builtBy: [
//           {
//             username: 'contributor3',
//             url: 'https://github.com/contributor3'
//           }
//         ]
//       },
//       {
//         author: 'tailwindlabs',
//         name: 'tailwindcss',
//         avatar: 'https://github.com/tailwindlabs.png',
//         url: 'https://github.com/tailwindlabs/tailwindcss',
//         description: 'A utility-first CSS framework for rapid UI development.',
//         language: 'JavaScript',
//         languageColor: '#f1e05a',
//         stars: 68000,
//         forks: 3400,
//         currentPeriodStars: 650,
//         builtBy: [
//           {
//             username: 'contributor4',
//             url: 'https://github.com/contributor4'
//           }
//         ]
//       },
//       {
//         author: 'denoland',
//         name: 'deno',
//         avatar: 'https://github.com/denoland.png',
//         url: 'https://github.com/denoland/deno',
//         description: 'A secure JavaScript and TypeScript runtime',
//         language: 'Rust',
//         languageColor: '#dea584',
//         stars: 87000,
//         forks: 4800,
//         currentPeriodStars: 600,
//         builtBy: [
//           {
//             username: 'contributor5',
//             url: 'https://github.com/contributor5'
//           }
//         ]
//       }
//     ]
//   }
//
//   return Promise.resolve(mockData as GithubTrendingResponse)
// }
