#!/bin/bash

# 材质库管理系统部署脚本
# 使用方法: ./deploy.sh [环境] [操作]
# 环境: dev, staging, prod
# 操作: build, deploy, restart, logs, stop

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-dev}
ACTION=${2:-deploy}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 设置环境变量
setup_environment() {
    log_info "设置 $ENVIRONMENT 环境..."
    
    case $ENVIRONMENT in
        dev)
            export COMPOSE_FILE="docker-compose.yml:docker-compose.dev.yml"
            export NODE_ENV="development"
            ;;
        staging)
            export COMPOSE_FILE="docker-compose.yml:docker-compose.staging.yml"
            export NODE_ENV="staging"
            ;;
        prod)
            export COMPOSE_FILE="docker-compose.yml:docker-compose.prod.yml"
            export NODE_ENV="production"
            ;;
        *)
            log_error "未知环境: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    # 加载环境变量文件
    if [ -f "$SCRIPT_DIR/.env.$ENVIRONMENT" ]; then
        source "$SCRIPT_DIR/.env.$ENVIRONMENT"
        log_success "已加载环境变量文件: .env.$ENVIRONMENT"
    else
        log_warning "环境变量文件不存在: .env.$ENVIRONMENT"
    fi
}

# 构建前端
build_frontend() {
    log_info "构建前端应用..."
    
    cd "$PROJECT_DIR"
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm ci
    fi
    
    # 运行测试
    if [ "$ENVIRONMENT" != "dev" ]; then
        log_info "运行测试..."
        npm run test:unit
    fi
    
    # 构建应用
    log_info "构建应用..."
    npm run build
    
    log_success "前端构建完成"
}

# 构建Docker镜像
build_images() {
    log_info "构建Docker镜像..."
    
    cd "$SCRIPT_DIR"
    docker-compose build --no-cache
    
    log_success "Docker镜像构建完成"
}

# 部署应用
deploy_application() {
    log_info "部署应用到 $ENVIRONMENT 环境..."
    
    cd "$SCRIPT_DIR"
    
    # 停止现有服务
    docker-compose down
    
    # 启动服务
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 健康检查
    if health_check; then
        log_success "应用部署成功"
    else
        log_error "应用部署失败"
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost/health > /dev/null 2>&1; then
            log_success "健康检查通过"
            return 0
        fi
        
        log_info "健康检查失败，重试 $attempt/$max_attempts"
        sleep 10
        ((attempt++))
    done
    
    log_error "健康检查失败"
    return 1
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    
    cd "$SCRIPT_DIR"
    docker-compose restart
    
    if health_check; then
        log_success "服务重启成功"
    else
        log_error "服务重启失败"
        exit 1
    fi
}

# 查看日志
show_logs() {
    log_info "显示服务日志..."
    
    cd "$SCRIPT_DIR"
    docker-compose logs -f --tail=100
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    cd "$SCRIPT_DIR"
    docker-compose down
    
    log_success "服务已停止"
}

# 清理资源
cleanup() {
    log_info "清理未使用的Docker资源..."
    
    docker system prune -f
    docker volume prune -f
    
    log_success "清理完成"
}

# 备份数据
backup_data() {
    log_info "备份数据..."
    
    local backup_dir="$SCRIPT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份数据库
    docker-compose exec -T database pg_dump -U material_user material_db > "$backup_dir/database.sql"
    
    # 备份Redis数据
    docker-compose exec -T redis redis-cli BGSAVE
    docker cp "$(docker-compose ps -q redis):/data/dump.rdb" "$backup_dir/redis.rdb"
    
    log_success "数据备份完成: $backup_dir"
}

# 恢复数据
restore_data() {
    local backup_dir=$1
    
    if [ -z "$backup_dir" ]; then
        log_error "请指定备份目录"
        exit 1
    fi
    
    if [ ! -d "$backup_dir" ]; then
        log_error "备份目录不存在: $backup_dir"
        exit 1
    fi
    
    log_info "恢复数据从: $backup_dir"
    
    # 恢复数据库
    if [ -f "$backup_dir/database.sql" ]; then
        docker-compose exec -T database psql -U material_user -d material_db < "$backup_dir/database.sql"
        log_success "数据库恢复完成"
    fi
    
    # 恢复Redis数据
    if [ -f "$backup_dir/redis.rdb" ]; then
        docker-compose stop redis
        docker cp "$backup_dir/redis.rdb" "$(docker-compose ps -q redis):/data/dump.rdb"
        docker-compose start redis
        log_success "Redis数据恢复完成"
    fi
}

# 显示帮助信息
show_help() {
    echo "材质库管理系统部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [环境] [操作]"
    echo ""
    echo "环境:"
    echo "  dev      开发环境"
    echo "  staging  预发布环境"
    echo "  prod     生产环境"
    echo ""
    echo "操作:"
    echo "  build    构建应用和镜像"
    echo "  deploy   部署应用"
    echo "  restart  重启服务"
    echo "  logs     查看日志"
    echo "  stop     停止服务"
    echo "  cleanup  清理资源"
    echo "  backup   备份数据"
    echo "  restore  恢复数据"
    echo "  health   健康检查"
    echo ""
    echo "示例:"
    echo "  $0 prod deploy    # 部署到生产环境"
    echo "  $0 dev logs       # 查看开发环境日志"
    echo "  $0 prod backup    # 备份生产环境数据"
}

# 主函数
main() {
    case $ACTION in
        build)
            check_dependencies
            setup_environment
            build_frontend
            build_images
            ;;
        deploy)
            check_dependencies
            setup_environment
            build_frontend
            build_images
            deploy_application
            ;;
        restart)
            check_dependencies
            setup_environment
            restart_services
            ;;
        logs)
            setup_environment
            show_logs
            ;;
        stop)
            setup_environment
            stop_services
            ;;
        cleanup)
            cleanup
            ;;
        backup)
            setup_environment
            backup_data
            ;;
        restore)
            setup_environment
            restore_data $3
            ;;
        health)
            health_check
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知操作: $ACTION"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"