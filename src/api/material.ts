/**
 * 材质相关API接口
 */

import request from "../utils/request";

// API响应类型
interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 材质查询参数
export interface MaterialQueryRequest {
  orderBy?: number; // 排序字段{0:根据 example 的字段排序，1:根据耗时排序}
  begin?: string; // 开始时间
  end?: string; // 结束时间
  pageNum: number; // 页码，从 1 开始
  pageSize: number; // 每页条数，最大值为 100
  name?: string; // 材质名称（模糊查询）
  type?: number; // 材质类型：0-系统材质库，1-用户材质库
  format?: string; // 文件格式
}

// 材质对象
export interface Material {
  id: number;
  name: string;
  type: number; // 0-系统材质库，1-用户材质库
  format: string;
  ossPath: string;
  createTime: string;
  updateTime: string;
}

// 扩展材质对象（包含实际URL）
export interface ExtendedMaterial extends Material {
  realUrl?: string; // 实际的OSS下载链接
}

// 分页结果
export interface MaterialListResponse {
  records: Material[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/**
 * 上传材质
 */
export async function uploadMaterial(
  name: string,
  type: number,
  file: File
): Promise<ApiResponse<Material>> {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("type", type.toString());
  formData.append("file", file);

  try {
    const response = await request.post("/material/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("上传材质响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("上传材质错误:", error);
    throw error;
  }
}

/**
 * 查询材质列表
 */
export async function getMaterialList(
  params: MaterialQueryRequest
): Promise<ApiResponse<MaterialListResponse>> {
  try {
    const response = await request.post("/material/list", params);

    console.log("查询材质列表响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("查询材质列表错误:", error);
    throw error;
  }
}

/**
 * 删除材质
 */
export async function deleteMaterial(id: number): Promise<ApiResponse<void>> {
  try {
    const response = await request.delete(`/material/${id}`);

    console.log("删除材质响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("删除材质错误:", error);
    throw error;
  }
}

/**
 * 获取系统材质库（平台公用）
 */
export async function getSystemMaterials(
  pageNum: number = 1,
  pageSize: number = 20,
  name?: string
): Promise<ApiResponse<MaterialListResponse>> {
  return getMaterialList({
    pageNum,
    pageSize,
    type: 0, // 系统材质库
    name,
  });
}

/**
 * 获取用户材质库（我的）
 */
export async function getUserMaterials(
  pageNum: number = 1,
  pageSize: number = 20,
  name?: string
): Promise<ApiResponse<MaterialListResponse>> {
  return getMaterialList({
    pageNum,
    pageSize,
    type: 1, // 用户材质库
    name,
  });
}

/**
 * 获取材质下载链接
 */
export async function getMaterialDownloadUrl(
  id: number
): Promise<ApiResponse<string>> {
  try {
    const response = await request.post(`/material/download/${id}`);

    console.log("获取材质下载链接响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("获取材质下载链接错误:", error);
    throw error;
  }
}

/**
 * 获取材质详情
 */
export async function getMaterialDetail(
  id: number
): Promise<ApiResponse<Material>> {
  try {
    const response = await request.get(`/material/${id}`);

    console.log("获取材质详情响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("获取材质详情错误:", error);
    throw error;
  }
}
